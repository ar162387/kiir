'use server';
import {provisionAuthUser} from './provision';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createStaffClient } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { requireStaff } from './session';
import { safeAdminReturnPath, validatePassword } from './permissions';

export interface ActionState { error?: string; success?: string }
const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim();
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

async function consumeLoginLimit(email: string) {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return false;
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const admin = createAdminClient();
  const buckets = [[`email:${email}`, 8], [`ip:${ip}`, 40]] as const;
  const results = await Promise.all(buckets.map(async ([value, limit]) => {
    const bucket = createHmac('sha256', secret).update(value).digest('hex');
    const { data, error } = await admin.rpc('cms_consume_rate_limit', {
      bucket, max_attempts: limit, window_seconds: 600,
    });
    return !error && data === true;
  }));
  return results.every(Boolean);
}

export async function login(_previous: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, 'email').toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!email || email.length > 254 || !email.includes('@') || !password || password.length > 128) {
    return { error: 'Enter your email address and password.' };
  }
  if (!getSupabaseConfig()) return { error: 'Staff sign-in is not configured. Contact the site administrator.' };
  let allowed: boolean;
  try { allowed = await consumeLoginLimit(email); }
  catch { return { error: 'Staff sign-in is temporarily unavailable. Please try again shortly.' }; }
  if (!allowed) return { error: 'Sign-in is unavailable or too many attempts were made. Please try again in 10 minutes.' };

  const client = await createStaffClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'The email or password is incorrect, or this account is unavailable.' };
  const { data: member, error: memberError } = await client.from('cms_memberships')
    .select('is_enabled,must_change_password').eq('user_id', data.user.id).maybeSingle();
  if (memberError || !member?.is_enabled) {
    await client.auth.signOut();
    return { error: 'This account does not have active CMS access. Contact an Admin.' };
  }
  await createAdminClient().from('cms_audit_logs').insert({ actor_id: data.user.id, action: 'staff.signed_in', entity_id: data.user.id });
  redirect(member.must_change_password ? '/admin/account' : safeAdminReturnPath(form.get('next')));
}

export async function logout() {
  const client = await createStaffClient();
  await client.auth.signOut();
  redirect('/admin/login');
}

export async function changePassword(_previous: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireStaff(undefined, true);
  const current = String(form.get('current_password') ?? '');
  const password = String(form.get('password') ?? '');
  const validation = validatePassword(password);
  if (validation) return { error: validation };
  if (password !== String(form.get('confirmation') ?? '')) return { error: 'The new passwords do not match.' };
  if (!current || current.length > 128 || current === password) return { error: 'Enter your current password and choose a different new password.' };
  const config = getSupabaseConfig()!;
  const verifier = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: verification, error: verifyError } = await verifier.auth.signInWithPassword({ email: member.email, password: current });
  if (verifyError || verification.user?.id !== member.user_id) return { error: 'The current password is incorrect.' };
  // Dispose of the extra reauthentication session without touching the main one.
  await verifier.auth.signOut({ scope: 'local' });
  const client = await createStaffClient();
  const { error } = await client.auth.updateUser({ password });
  if (error) return { error: 'The password could not be updated. Please try again.' };
  await client.auth.signOut({ scope: 'others' });
  const { error: membershipError } = await createAdminClient().rpc('cms_record_password_change', { target: member.user_id });
  if (membershipError) return { error: 'Your password changed, but account activation could not finish. Sign out and contact an Admin.' };
  revalidatePath('/admin', 'layout');
  redirect('/admin?notice=password');
}

export async function createStaffUser(_previous: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireStaff('users.manage');
  const email = text(form, 'email').toLowerCase();
  const name = text(form, 'display_name');
  const role = text(form, 'role');
  const password = String(form.get('password') ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: 'Enter a valid email address.' };
  if (!name || name.length > 120) return { error: 'Enter a name with 1–120 characters.' };
  if (!['admin', 'content_manager'].includes(role)) return { error: 'Choose a valid staff role.' };
  const validation = validatePassword(password);
  if (validation) return { error: validation };
  const admin = createAdminClient();
  const { data, error } = await provisionAuthUser(admin,{ email, password, email_confirm: true });
  if (error || !data.user) return { error: 'This account could not be created. Check whether the email already has an account.' };
  const { error: membershipError } = await admin.rpc('cms_set_member', {
    actor: actor.user_id, target: data.user.id, member_email: email, member_name: name,
    member_role: role, enabled: true, require_password_change: true,
  });
  if (membershipError) {
    const { error: rollbackError } = await admin.auth.admin.deleteUser(data.user.id);
    if (rollbackError) console.error('Staff provisioning compensation failed', { userId: data.user.id });
    return { error: 'Staff access could not be assigned. No CMS access was granted.' };
  }
  revalidatePath('/admin/users');
  return { success: 'Staff account created. Share the temporary password privately; they must change it when signing in.' };
}

export async function updateStaffUser(_previous: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireStaff('users.manage');
  const target = text(form, 'user_id');
  const role = text(form, 'role');
  const enabled = form.get('enabled') === 'on';
  if (!UUID.test(target) || !['admin', 'content_manager'].includes(role)) return { error: 'Choose a valid staff member and role.' };
  if (actor.user_id === target) return { error: 'Ask another Admin to change your own role or access.' };
  const admin = createAdminClient();
  const { data: existing } = await admin.from('cms_memberships').select('*').eq('user_id', target).single();
  if (!existing) return { error: 'This staff account could not be found.' };
  const { error } = await admin.rpc('cms_set_member', {
    actor: actor.user_id, target, member_email: existing.email, member_name: existing.display_name,
    member_role: role, enabled, require_password_change: existing.must_change_password,
  });
  if (error) return { error: 'Access could not be changed. Keep at least one enabled Admin.' };
  revalidatePath('/admin/users');
  return { success: 'Staff permissions updated. Disabled accounts immediately lose CMS access.' };
}

export async function resetStaffPassword(_previous: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireStaff('users.manage');
  const target = text(form, 'user_id');
  const password = String(form.get('password') ?? '');
  if (!UUID.test(target) || target === actor.user_id) return { error: 'Use My account to change your own password.' };
  const validation = validatePassword(password);
  if (validation) return { error: validation };
  const admin = createAdminClient();
  const { data: member } = await admin.from('cms_memberships').select('*').eq('user_id', target).single();
  if (!member) return { error: 'Staff account not found.' };
  // Mark first so a partial Auth failure cannot leave an active old session usable.
  const { error: markError } = await admin.rpc('cms_set_member', {
    actor: actor.user_id, target, member_email: member.email, member_name: member.display_name,
    member_role: member.role, enabled: member.is_enabled, require_password_change: true,
  });
  if (markError) return { error: 'Password reset could not be started.' };
  const { error } = await admin.auth.admin.updateUserById(target, { password });
  if (error) return { error: 'Password reset did not finish. This account remains restricted until it is completed.' };
  revalidatePath('/admin/users');
  return { success: 'Temporary password set. Share it privately; the staff member must change it at next sign-in.' };
}
