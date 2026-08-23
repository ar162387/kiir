"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRight } from "@/components/icons";
import type { OrgSettings, Program } from "@/lib/types";

export default function AboutClient({
  org,
  programs,
}: {
  org: OrgSettings;
  programs: Program[];
}) {
  const { t, isUr, pick } = useLanguage();

  return (
    <div>
      <section className="border-b border-line bg-tint">
        <div className="mx-auto max-w-[1520px] px-4 py-11 sm:px-6 sm:py-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal">{t.about}</div>
          <h1 className={isUr ? "mt-2.5 max-w-[24ch] font-urdu text-[32px] leading-[2] text-navy" : "mt-2.5 max-w-[24ch] font-serif text-[clamp(30px,4vw,46px)] leading-[1.1] tracking-[-0.02em] text-navy"}>
            {pick(org.name, org.name_ur)}
          </h1>
          <p className={isUr ? "mt-4 max-w-[60ch] font-urdu text-base leading-[2.3] text-slate" : "mt-4 max-w-[60ch] font-serif text-lg leading-relaxed text-slate"}>
            {pick(org.mission, org.mission_ur)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1520px] px-4 py-11 sm:px-6">
        <div>
          <h2 className="m-0 mb-5.5 border-b border-navy pb-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
            {t.ourPrograms}
          </h2>
          <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {programs.map((p) => (
              <Link key={p.slug} href={`/programs/${p.slug}`} className="group flex min-h-47.5 flex-col gap-3 bg-canvas pb-6 transition-colors duration-200 hover:bg-surface">
                <span className="block h-33 w-full overflow-hidden bg-thumb">
                  <span aria-hidden className="block h-full w-full bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-110" style={p.image_url ? { backgroundImage: `url(\"${p.image_url}\")` } : undefined} />
                </span>
                <span className={isUr ? "block px-5.5 font-urdu text-[18px] leading-[2.1] text-navy" : "block px-5.5 font-serif text-[19px] leading-[1.22] text-navy"}>
                  {pick(p.name, p.name_ur)}
                </span>
                <span className={isUr ? "block px-5.5 font-urdu text-[12.5px] leading-[2.2] text-slate" : "block px-5.5 text-[13px] leading-relaxed text-slate"}>{pick(p.description, p.description_ur)}</span>
                <span className="flex-1" />
                <span className="mx-5.5 flex items-center justify-end border-t border-line-soft pt-3 text-teal"><ArrowRight /></span>
              </Link>
            ))}
          </div>
        </div>

        <blockquote className="mt-13 border-l-4 border-cyan bg-tint px-6 py-7 sm:px-9">
          <p className={isUr ? "m-0 font-urdu text-[20px] leading-[2.3] text-navy" : "m-0 max-w-[52ch] font-serif text-[24px] leading-[1.42] text-navy"}>
            {isUr ? "امن کی پائیدار بنیاد باوقار مکالمے، تحقیق اور ان آوازوں کی نمائندگی میں ہے جنہیں طویل عرصے سے نظر انداز کیا گیا ہے۔" : "A durable peace begins with dignified dialogue, rigorous research and representation for the voices too long left outside the room."}
          </p>
          <footer className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-teal">{isUr ? "چیئرمین، کے آئی آئی آر" : "Chairman, KIIR"}</footer>
        </blockquote>
      </section>
    </div>
  );
}
