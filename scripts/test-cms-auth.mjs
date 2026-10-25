import {provisionUser} from './provision-user.mjs';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPBASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && key && secret, 'Supabase configuration required');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secret, options);
const anon = createClient(url, key, options);
const created = [];
const clients = [];
const suffix = randomBytes(8).toString('hex');
let passed = 0;
function check(condition, message) { assert.ok(condition, message); passed++; console.log(`PASS ${message}`); }
try {
  const identities = {};
  for (const [kind, role, enabled] of [['admin', 'admin', true], ['editor', 'content_manager', true], ['outsider', null, true], ['disabled', 'content_manager', false]]) {
    const email = `kiir-cms-test-${suffix}-${kind}@example.invalid`;
    const password = 'TestKiir1!' + randomBytes(18).toString('base64url');
    const { data, error } = await provisionUser(admin,{ email, password, email_confirm: true });
    assert.ifError(error); created.push(data.user.id);
    if (role) {
      const { error } = await admin.from('cms_memberships').insert({ user_id: data.user.id, email, display_name: `Disposable ${kind}`, role, is_enabled: enabled, must_change_password: false });
      assert.ifError(error);
    }
    const client = createClient(url, key, options); clients.push(client);
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    assert.ifError(signInError);
    identities[kind] = { id: data.user.id, client };
  }
  const { error: anonymousRead } = await anon.from('cms_memberships').select('*');
  check(Boolean(anonymousRead), 'anonymous visitors cannot read staff records');
  const { data: outsiderRead, error: outsiderError } = await identities.outsider.client.from('cms_memberships').select('*');
  check(!outsiderError && outsiderRead.length === 0, 'authenticated nonstaff users cannot read memberships');
  const { data: editorRead } = await identities.editor.client.from('cms_memberships').select('*');
  check(editorRead?.length === 1 && editorRead[0].user_id === identities.editor.id, 'Content Manager can read only their own membership');
  const { error: escalation } = await identities.editor.client.from('cms_memberships').update({ role: 'admin' }).eq('user_id', identities.editor.id);
  check(Boolean(escalation), 'Content Manager cannot grant themselves Admin');
  const { data: editorAudit } = await identities.editor.client.from('cms_audit_logs').select('*');
  check(editorAudit?.length === 0, 'Content Manager cannot read the organization audit log');
  const { data: adminRead } = await identities.admin.client.from('cms_memberships').select('*');
  check(adminRead?.length >= 4, 'Admin can read the staff roster');
  const { error: forgePasswordChange } = await identities.editor.client.rpc('cms_record_password_change', { target: identities.editor.id });
  check(Boolean(forgePasswordChange), 'authenticated callers cannot bypass the mandatory password-change flag');
  const rpcArgs = { actor: identities.admin.id, target: identities.editor.id, member_email: editorRead[0].email, member_name: 'Disposable editor', member_role: 'admin', enabled: true, require_password_change: false };
  const { error: forgeAdmin } = await identities.editor.client.rpc('cms_set_member', rpcArgs);
  check(Boolean(forgeAdmin), 'client cannot invoke the service-only membership mutation');
  const { error: forgedActor } = await admin.rpc('cms_set_member', { ...rpcArgs, actor: identities.editor.id });
  check(Boolean(forgedActor), 'membership mutation checks the acting Admin again inside the transaction');
  const { error: disableError } = await admin.rpc('cms_set_member', { ...rpcArgs, member_role: 'content_manager', enabled: false });
  assert.ifError(disableError);
  const { data: disabledRead } = await identities.editor.client.from('cms_memberships').select('is_enabled').eq('user_id', identities.editor.id).single();
  check(disabledRead?.is_enabled === false, 'existing sessions immediately observe membership disablement');
  const { error: restrictionError } = await admin.from('cms_memberships')
    .update({ is_enabled: true, must_change_password: true }).eq('user_id', identities.disabled.id);
  assert.ifError(restrictionError);
  const newPassword = 'ChangedKiir1!' + randomBytes(18).toString('base64url');
  const { error: passwordError } = await identities.disabled.client.auth.updateUser({ password: newPassword });
  assert.ifError(passwordError);
  const { error: completionError } = await admin.rpc('cms_record_password_change', { target: identities.disabled.id });
  assert.ifError(completionError);
  const { data: activated } = await identities.disabled.client.from('cms_memberships').select('must_change_password').single();
  check(activated?.must_change_password === false, 'Auth password change and service-only activation complete the first-use lifecycle');
  // Demotion takes effect against an existing token, without refreshing JWT claims.
  const { error: demoteError } = await admin.rpc('cms_set_member', {
    actor: identities.admin.id, target: identities.admin.id, member_email: `kiir-cms-test-${suffix}-admin@example.invalid`, member_name: 'Disposable admin', member_role: 'content_manager', enabled: true, require_password_change: false,
  });
  assert.ifError(demoteError);
  const { data: afterDemotion } = await identities.admin.client.from('cms_memberships').select('*');
  check(afterDemotion?.length === 1, 'demotion removes roster access from an existing session immediately');
  for (let i = 0; i < 3; i++) {
    const { data, error } = await admin.rpc('cms_consume_rate_limit', { bucket: `test-${suffix}`, max_attempts: 2, window_seconds: 600 });
    assert.ifError(error); assert.equal(data, i < 2);
  }
  check(true, 'persistent login limiter rejects requests after the allowed budget');
  const { error: unauthorizedLimit } = await anon.rpc('cms_consume_rate_limit', { bucket: `test-${suffix}`, max_attempts: 1000, window_seconds: 1 });
  check(Boolean(unauthorizedLimit), 'anonymous clients cannot reset or override server rate limits');
  console.log(`${passed} live authentication/RLS checks passed.`);
} finally {
  for (const client of clients) await client.auth.signOut({ scope: 'local' });
  let cleanupFailed = false;
  if (created.length) {
    const { error } = await admin.from('cms_audit_logs').delete().in('entity_id', created);
    if (error) { cleanupFailed = true; console.error('Disposable audit-entry cleanup failed.'); }
  }
  for (const id of created.reverse()) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) { cleanupFailed = true; console.error('Disposable test account cleanup failed:', id); }
  }
  if (cleanupFailed) process.exitCode = 1;
  else console.log('Disposable test accounts removed.');
}
