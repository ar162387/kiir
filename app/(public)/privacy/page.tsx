import {pageMetadata} from '@/lib/seo';
import {getContactSettings} from '@/lib/queries';
import {getLocale} from '@/lib/locale';
import Link from "@/components/LocalizedLink";

export async function generateMetadata(){return pageMetadata('/privacy','Privacy Policy','رازداری کی پالیسی');}

export default async function PrivacyPage() {
  const [contact,lang]=await Promise.all([getContactSettings(),getLocale()]);
  return (
    <div className="mx-auto max-w-[760px] px-4 py-16 sm:px-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal">Legal</span>
      <h1 className="mt-2.5 font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.1] tracking-[-0.02em] text-navy">
        {lang==='ur'?'رازداری کی پالیسی':'Privacy Policy'}
      </h1>
      <p className="mt-5 text-[15px] leading-relaxed text-slate" lang="en" dir="ltr">
        KIIR&apos;s formal privacy policy is being finalized alongside this new site. In the meantime: the
        contact form on this site stores only what you submit (name, email, subject, message) to respond
        to your enquiry, and is not shared with third parties. This site does not use third-party
        advertising trackers.
      </p>
      {contact.email&&<p className="mt-4 text-[15px] leading-relaxed text-slate" lang="en" dir="ltr">Questions? <a href={`mailto:${contact.email}`} className="underline">{contact.email}</a></p>}
      <Link href="/" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-teal hover:text-navy">
        ← Back to homepage
      </Link>
    </div>
  );
}
