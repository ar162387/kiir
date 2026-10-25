import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createStaffClient } from '@/lib/supabase/auth';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { hasPermission, type Permission, type StaffRole } from './permissions';

export interface StaffMember {
  user_id: string;
  display_name: string;
  email: string;
  role: StaffRole;
  is_enabled: boolean;
  must_change_password: boolean;
  created_at: string;
}

export const getStaffSession = cache(async () => {
  if (!getSupabaseConfig()) return { member: null, issue: 'configuration' as const };
  const client = await createStaffClient();
  // getUser verifies with Auth, including server-side revocation/ban state.
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { member: null, issue: 'signed_out' as const };
  const { data, error: membershipError } = await client.from('cms_memberships')
    .select('user_id,display_name,email,role,is_enabled,must_change_password,created_at')
    .eq('user_id', user.id).maybeSingle();
  if (membershipError) return { member: null, issue: 'database' as const };
  if (!data || !data.is_enabled) return { member: null, issue: 'not_staff' as const };
  return { member: data as StaffMember, issue: null };
});

export async function requireStaff(permission?: Permission, allowPasswordChange = false) {
  const { member, issue } = await getStaffSession();
  if (!member) redirect(`/admin/login${issue && issue !== 'signed_out' ? `?reason=${issue}` : ''}`);
  if (member.must_change_password && !allowPasswordChange) redirect('/admin/account');
  if (permission && !hasPermission(member.role, permission)) redirect('/admin?notice=permission');
  return member;
}
