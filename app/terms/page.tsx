import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-16 sm:px-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal">Legal</span>
      <h1 className="mt-2.5 font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.1] tracking-[-0.02em] text-navy">
        Terms of Use
      </h1>
      <p className="mt-5 text-[15px] leading-relaxed text-slate">
        KIIR&apos;s formal terms of use are being finalized alongside this new site. As stated on individual
        items, KIIR briefings are free to read and republish with attribution unless noted otherwise.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-slate">
        Questions about reuse or citation? Write to{" "}
        <a href="mailto:info@kiir.org" className="text-navy underline underline-offset-2 hover:text-teal">
          info@kiir.org
        </a>
        .
      </p>
      <Link href="/" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-teal hover:text-navy">
        ← Back to homepage
      </Link>
    </div>
  );
}
