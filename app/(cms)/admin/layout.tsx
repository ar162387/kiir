import Link from '@/components/AppLink';
import SubmitButton from '@/components/SubmitButton';
import Image from 'next/image';
import type { Metadata } from 'next';
import { requireStaff } from '@/lib/cms/session';
import { logout } from '@/lib/cms/actions';
import '../../admin.css';

export const metadata: Metadata = { title: { default: 'CMS', template: '%s · KIIR CMS' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const member = await requireStaff(undefined, true);
  return <div className="cms cms-shell" lang="en" dir="ltr">
    <aside className="cms-sidebar">
      <Link href="/admin" className="cms-brand"><Image src="/logo/kiirlogo.png" alt="KIIR" width={44} height={44} /><span>KIIR<span className="cms-brand-sub">Content workspace</span></span></Link>
      <p className="cms-nav-label">WORKSPACE</p>
      <nav aria-label="CMS navigation"><Link href="/admin">Overview</Link>{!member.must_change_password&&<><Link href="/admin/content">Content</Link><Link href="/admin/programs">Programs</Link><Link href="/admin/media">Media library</Link><Link href="/admin/settings">Website settings</Link><Link href="/admin/help">Staff guide</Link></>}<Link href="/admin/account">My account</Link>
        {member.role === 'admin' && !member.must_change_password && <><p className="cms-nav-label">ADMINISTRATION</p><Link href="/admin/users">Staff & access</Link><Link href="/admin/audit">Activity log</Link><Link href="/admin/messages">Contact inbox</Link></>}
      </nav>
      <div className="cms-sidebar-bottom"><Link href="/" target="_blank" rel="noopener noreferrer">View website ↗</Link><p>{member.display_name}<span>{member.role === 'admin' ? 'Admin' : 'Content Manager'}</span></p><form action={logout}><SubmitButton className="cms-signout" pendingLabel="Signing out…">Sign out</SubmitButton></form></div>
    </aside>
    <div className="cms-workspace"><header className="cms-topbar"><span>KIIR / Editorial workspace</span><span className="cms-pill">{member.role === 'admin' ? 'Admin' : 'Content Manager'}</span></header><main id="main-content" className="cms-main">{children}</main></div>
  </div>;
}
