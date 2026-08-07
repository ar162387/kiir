"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import type { OrgSettings } from "@/lib/types";

export default function SiteHeader({ org }: { org: OrgSettings }) {
  const { isUr, pick } = useLanguage();

  return (
    <header className="border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center gap-4 px-4 py-5 sm:px-6 sm:py-[22px] sm:pb-[18px]">
        <Link href="/" className="flex items-center gap-3.5">
          <Image
            src={org.logo_url}
            alt="KIIR"
            height={52}
            width={150}
            priority
            className="block h-11 w-auto sm:h-[52px]"
          />
          <span className="flex flex-col gap-1.5 border-l border-line pl-3.5">
            <span className={isUr ? "block font-urdu text-[15px] leading-snug text-navy" : "block font-serif text-base leading-tight text-navy"}>
              {pick(org.name, org.name_ur)}
            </span>
            <span className="block font-mono text-[10.5px] tracking-[0.14em] text-teal uppercase">
              {org.tagline}
            </span>
          </span>
        </Link>
        <div className="flex-1" />
        <p
          className={
            isUr
              ? "max-w-[300px] border-l-2 border-cyan pl-3 font-urdu text-[13px] leading-relaxed text-slate"
              : "max-w-[300px] border-l-2 border-cyan pl-3 text-[12.5px] leading-relaxed text-slate"
          }
        >
          {pick(org.blurb, org.blurb_ur)}
        </p>
      </div>
    </header>
  );
}
