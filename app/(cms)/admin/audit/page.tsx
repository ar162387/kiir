import { requireStaff } from '@/lib/cms/session';
import { createStaffClient } from '@/lib/supabase/auth';

const labels: Record<string, string> = { 'staff.signed_in': 'Staff signed in', 'staff.updated': 'Staff access updated', 'staff.password_changed': 'Password changed', 'staff.bootstrap': 'First Admin provisioned', 'content.draft':'Draft saved','content.publish':'Content published','content.unpublish':'Content unpublished','content.archive':'Content archived','content.delete':'Content deleted','program.insert':'Program created', 'program.update':'Program updated', 'program.delete':'Program deleted' };

export default async function AuditPage() {
  await requireStaff('audit.read');
  const client = await createStaffClient();
  const [{ data, error }, { data: members }] = await Promise.all([
    client.from('cms_audit_logs').select('id,actor_id,action,entity_id,summary,created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100),
    client.from('cms_memberships').select('user_id,display_name'),
  ]);
  const names = new Map(members?.map(m => [m.user_id, m.display_name]) ?? []);
  return <><p className="cms-eyebrow">ADMINISTRATION</p><h1>Activity log</h1><p className="cms-description">The latest 100 account, program and content events. Times are shown in Pakistan Standard Time.</p>
    <section className="cms-panel cms-audit-panel">
      {error ? <p role="alert">The activity log could not be loaded. Please try again.</p> : !data?.length ? <p>No staff activity has been recorded yet.</p> : <div className="cms-table-scroll"><table><thead><tr><th>Action</th><th>By</th><th>Item</th><th>Date & time</th></tr></thead><tbody>{data.map(event => <tr key={event.id}><td>{labels[event.action] ?? event.action}</td><td>{names.get(event.actor_id) ?? 'System'}</td><td>{names.get(event.entity_id) ?? (typeof event.summary?.name==='string'?event.summary.name:'—')}</td><td>{new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at))}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
