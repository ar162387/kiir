"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { Diamond } from "@/components/icons";
import type { AboutSettings, OrgSettings, Program } from "@/lib/types";

export default function AboutClient({
  org,
  about,
  programs,
}: {
  org: OrgSettings;
  about: AboutSettings;
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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="m-0 mb-3.5 border-b border-navy pb-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
              {isUr ? "ہماری تاریخ" : "Our history"}
            </h2>
            <p className={isUr ? "font-urdu text-[15px] leading-[2.3] text-navy" : "font-serif text-[17px] leading-[1.72] text-navy"}>
              {pick(about.history_en, about.history_ur)}
            </p>
          </div>
          <div className="border border-line p-5.5">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-teal">
              {isUr ? "قائم" : "Founded"}
            </div>
            <div className="mt-1.5 font-serif text-[32px] text-navy">{about.founded}</div>
            <div className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-teal">
              {isUr ? "مقام" : "Headquarters"}
            </div>
            <div className={isUr ? "mt-1.5 font-urdu text-sm text-navy" : "mt-1.5 text-sm text-navy"}>
              Islamabad, Pakistan
            </div>
          </div>
        </div>

        <div className="mt-13">
          <h2 className="m-0 mb-5.5 border-b border-navy pb-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
            {isUr ? "ہمارے اصول" : "How we work"}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {about.principles.map((p) => (
              <div key={p.title_en} className="border-t-2 border-cyan pt-4">
                <h3 className={isUr ? "m-0 font-urdu text-[18px] text-navy" : "m-0 font-serif text-[19px] text-navy"}>
                  {pick(p.title_en, p.title_ur)}
                </h3>
                <p className={isUr ? "mt-2.5 font-urdu text-[13px] leading-[2.2] text-slate" : "mt-2.5 text-[13.5px] leading-relaxed text-slate"}>
                  {pick(p.body_en, p.body_ur)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-13">
          <h2 className="m-0 mb-5.5 border-b border-navy pb-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
            {t.ourPrograms}
          </h2>
          <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {programs.map((p) => (
              <Link key={p.slug} href={`/programs/${p.slug}`} className="flex flex-col gap-2 bg-canvas p-5.5 transition-colors duration-150 hover:bg-tint">
                <Diamond size={9} className="text-cyan" />
                <span className={isUr ? "font-urdu text-[16px] text-navy" : "font-serif text-[16px] text-navy"}>
                  {pick(p.name, p.name_ur)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
