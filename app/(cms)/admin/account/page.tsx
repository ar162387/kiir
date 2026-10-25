import { requireStaff } from '@/lib/cms/session';
import { PasswordForm } from '@/components/admin/Forms';

export default async function AccountPage() {
  const member = await requireStaff(undefined, true);
  return <>
    <p className="cms-eyebrow">MY ACCOUNT</p><h1>{member.must_change_password ? 'Make this account yours.' : 'Your account'}</h1>
    <p className="cms-description">{member.must_change_password ? 'Choose a new password before accessing the rest of the workspace.' : 'Keep your staff account secure with a password only you know.'}</p>
    <div className="cms-account-grid"><section className="cms-panel"><h2>Change password</h2><PasswordForm /></section><aside className="cms-panel cms-account-details"><p className="cms-eyebrow">SIGNED IN AS</p><h2>{member.display_name}</h2><p>{member.email}</p><span className="cms-pill">{member.role === 'admin' ? 'Admin' : 'Content Manager'}</span><p className="cms-help">Password changes also sign out your other sessions. No email confirmation is needed.</p></aside></div>
  </>;
}
