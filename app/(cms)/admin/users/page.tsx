import type { StaffMember } from '@/lib/cms/session';
import { requireStaff } from '@/lib/cms/session';
import { createStaffClient } from '@/lib/supabase/auth';
import { CreateStaffForm, EditStaffForm } from '@/components/admin/Forms';

export default async function UsersPage() {
  const actor = await requireStaff('users.manage');
  const client = await createStaffClient();
  const { data, error } = await client.from('cms_memberships').select('*').order('created_at');
  return <>
    <p className="cms-eyebrow">ADMINISTRATION</p><h1>Staff & access</h1><p className="cms-description">Individual accounts. Clear responsibilities. Access you can change at any time.</p>
    <div className="cms-users-grid"><section><h2>Staff members</h2>
      {error && <p role="alert" className="cms-feedback cms-feedback-error">The staff list could not be loaded. Please try again.</p>}
      {(data as StaffMember[] ?? []).map(member => <article className="cms-panel cms-member" key={member.user_id}>
        <div className="cms-member-heading"><div><h3>{member.display_name}</h3><p>{member.email}</p></div><span className={`cms-pill ${!member.is_enabled ? 'cms-pill-muted' : ''}`}>{member.is_enabled ? 'Active' : 'Disabled'}</span></div>
        {member.must_change_password && <p className="cms-help">A password change is required before workspace access.</p>}
        <EditStaffForm member={member} isSelf={member.user_id === actor.user_id} />
      </article>)}
    </section><aside className="cms-panel cms-create-staff"><h2>Add a staff member</h2><p className="cms-description">New staff can sign in immediately with a temporary password.</p><CreateStaffForm /></aside></div>
  </>;
}
