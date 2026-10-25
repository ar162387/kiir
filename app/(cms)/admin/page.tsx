import Link from '@/components/AppLink';
import { requireStaff } from '@/lib/cms/session';
import { createStaffClient } from '@/lib/supabase/auth';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const member = await requireStaff();
  const { notice } = await searchParams;
  const client = await createStaffClient();
  const { count, error } = member.role === 'admin'
    ? await client.from('cms_memberships').select('user_id', { count: 'exact', head: true }).eq('is_enabled', true)
    : { count: null, error: null };
  return <>
    <p className="cms-eyebrow">YOUR WORKSPACE</p><h1>Welcome, {member.display_name.split(' ')[0]}.</h1><p className="cms-description">A shared home for KIIR’s editorial work.</p>
    {notice === 'password' && <p className="cms-feedback cms-feedback-success" role="status">Your password has been updated. Your workspace is ready.</p>}
    {notice === 'permission' && <p className="cms-feedback cms-feedback-error" role="alert">Your role does not have access to that area.</p>}
    <div className="cms-overview-grid">
      <section className="cms-panel cms-overview-hero"><p className="cms-eyebrow">PEACE THROUGH DIALOGUE</p><h2>Bring KIIR’s work into focus.</h2><p>Write articles, publish research and stories, plan events, and manage programs with optimized images.</p><Link className="cms-button cms-button-light" href="/admin/content">Manage content →</Link></section>
      <section className="cms-panel"><p className="cms-eyebrow">ACCOUNT</p><h2>{member.role === 'admin' ? 'Administrative access' : 'Editorial access'}</h2><p>{member.role === 'admin' ? 'Manage staff accounts, assign roles, and review the activity log.' : 'Write and publish content, manage programs, announcements, and public contact details. Staff access, branding and permanent deletion are reserved for Admins.'}</p><Link href="/admin/account" className="cms-text-link">Manage your account →</Link></section>
    </div>
    <section className="cms-panel cms-settings-section"><h2>Keep the website current.</h2><p>Update announcements, contact details and social links, or follow the staff publishing walkthrough.</p><Link href="/admin/settings" className="cms-text-link">Website settings →</Link> · <Link href="/admin/help" className="cms-text-link">Staff guide →</Link></section>
    {member.role === 'admin' && <div className="cms-overview-grid"><section className="cms-panel"><span className="cms-stat">{error ? '—' : count ?? 0}</span><h2>Active staff accounts</h2><p>Give each person their own account and the access they need.</p><Link className="cms-text-link" href="/admin/users">Manage staff & access →</Link></section><section className="cms-panel"><p className="cms-eyebrow">ACCOUNTABILITY</p><h2>A clear record of access changes.</h2><p>Review sign-ins, password changes, and staff permission updates.</p><Link className="cms-text-link" href="/admin/audit">Open activity log →</Link></section></div>}
  </>;
}
