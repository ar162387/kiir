import Link from '@/components/AppLink';
import Image from 'next/image';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/Forms';
import { getStaffSession } from '@/lib/cms/session';
import { safeAdminReturnPath } from '@/lib/cms/permissions';
import { getSupabaseConfig } from '@/lib/supabase/config';
import '../../../admin.css';

export const metadata: Metadata = { title: 'Staff sign-in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const params = await searchParams;
  const { member, issue } = await getStaffSession();
  if (member) redirect(member.must_change_password ? '/admin/account' : safeAdminReturnPath(params.next));
  return <main id="main-content" className="cms cms-login" lang="en" dir="ltr">
    <section className="cms-login-story">
      <Link href="/" className="cms-brand"><Image src="/logo/kiir-emblem.png" width={72} height={72} alt="KIIR" /><span>KIIR<span className="cms-brand-sub">Peace Through Dialogue</span></span></Link>
      <div className="cms-login-copy"><p className="cms-eyebrow">THE EDITORIAL DESK</p><h1>Ideas that inform.<br />Stories that matter.</h1><p>A dedicated workspace for the people documenting human rights, building dialogue, and advancing peace.</p><div className="cms-login-rule" /></div>
      <p className="cms-login-credit">Kashmir Institute of International Relations</p>
    </section>
    <section className="cms-login-panel"><div className="cms-login-card">
      <p className="cms-eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p className="cms-description">Manage KIIR’s content, programs, and publications.</p>
      {(issue === 'database' || params.reason === 'database') && <p role="status" className="cms-feedback cms-feedback-error">Staff access is being configured. Contact your administrator if this continues.</p>}
      {(issue === 'not_staff' || params.reason === 'not_staff') && <p role="status" className="cms-feedback cms-feedback-error">This account does not have active CMS access.</p>}
      <LoginForm configured={Boolean(getSupabaseConfig())} next={safeAdminReturnPath(params.next)} />
      <Link href="/" className="cms-back-link">← Back to the website</Link>
    </div></section>
  </main>;
}
