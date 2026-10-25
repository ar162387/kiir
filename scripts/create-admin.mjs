import {provisionUser} from './provision-user.mjs';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: npm run cms:create-admin -- admin@example.org');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL and server secret key are required.');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error: countError } = await client.from('cms_memberships').select('user_id', { count: 'exact', head: true });
if (countError) throw new Error('Apply the CMS authentication migration before creating the first Admin.');
if (count) throw new Error('Staff accounts already exist. Use Staff & access in the CMS instead of bootstrapping again.');
const password = 'Kiir1!' + randomBytes(24).toString('base64url');
// Save first: a filesystem error must not create an account with a lost password.
const file = '.cms-credentials-first-admin.txt';
writeFileSync(file, `KIIR CMS — first Admin\nEmail: ${email}\nTemporary password: ${password}\nSign in at /admin/login and change this password immediately.\nDelete this local file after changing the password.\n`, { mode: 0o600, flag: 'wx' });
const { data, error } = await provisionUser(client,{ email, password, email_confirm: true });
if (error || !data.user) throw new Error('Admin creation failed. Check Auth settings/account availability; the credentials file was not used.');
const { error: memberError } = await client.from('cms_memberships').insert({
  user_id: data.user.id, email, display_name: 'KIIR Admin', role: 'admin', must_change_password: true,
});
if (memberError) {
  await client.auth.admin.deleteUser(data.user.id);
  throw new Error('Admin membership could not be created. The new Auth account was rolled back.');
}
const { error: auditError } = await client.from('cms_audit_logs').insert({ actor_id: data.user.id, action: 'staff.bootstrap', entity_id: data.user.id });
if (auditError) console.warn('Admin exists, but its bootstrap audit entry could not be written.');
console.log(`First Admin created for ${email}. Temporary password saved in ${file} (permissions 0600).`);
