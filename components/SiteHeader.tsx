"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import type { OrgSettings } from "@/lib/types";

export default function SiteHeader({ org }: { org: OrgSettings }) {
  const { isUr, pick } = useLanguage();

  return (
    <header className="border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6 sm:py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={org.logo_url}
            alt="KIIR"
            height={128}
            width={128}
            priority
            className="block h-28 w-28 object-contain sm:h-32 sm:w-32"
          />
          <span className="flex flex-col gap-1.5">
            <span className={isUr ? "block font-urdu text-[15px] leading-snug text-navy" : "block font-display text-[15px] leading-tight tracking-[0.01em] text-navy sm:text-[17px]"}>
              {isUr ? pick(org.name, org.name_ur) : `${org.name} (KIIR)`}
            </span>
            <span className="block font-mono text-[10.5px] tracking-[0.14em] text-teal">
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
