"use client";
import FieldText from "@/components/FieldText";

import Link from "@/components/LocalizedLink";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRight } from "@/components/icons";
import type { OrgSettings, Program, AboutSettings } from "@/lib/types";

export default function AboutClient({
  org,
  programs,
  about,
}: {
  org: OrgSettings;
  programs: Program[];
  about: AboutSettings;
}) {
  const { t, isUr, pick } = useLanguage();

  return (
    <div>
      <section className="border-b border-line bg-tint">
        <div className="mx-auto max-w-[1520px] px-4 py-11 sm:px-6 sm:py-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal">{t.about}</div>
          <h1 className={isUr ? "mt-2.5 max-w-[24ch] font-urdu text-[32px] leading-[2] text-navy" : "mt-2.5 max-w-[24ch] font-serif text-[clamp(30px,4vw,46px)] leading-[1.1] tracking-[-0.02em] text-navy"}>
            <FieldText en={org.name} ur={org.name_ur} serif/>
          </h1>
          <p className={isUr ? "mt-4 max-w-[60ch] font-urdu text-base leading-[2.3] text-slate" : "mt-4 max-w-[60ch] font-serif text-lg leading-relaxed text-slate"}>
            <FieldText en={org.mission} ur={org.mission_ur}/>
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
                  <FieldText en={p.name} ur={p.name_ur} serif/>
                </span>
                <span className={isUr ? "block px-5.5 font-urdu text-[12.5px] leading-[2.2] text-slate" : "block px-5.5 text-[13px] leading-relaxed text-slate"}><FieldText en={p.description} ur={p.description_ur}/></span>
                <span className="flex-1" />
                <span className="mx-5.5 flex items-center justify-end border-t border-line-soft pt-3 text-teal"><ArrowRight /></span>
              </Link>
            ))}
          </div>
        </div>

        {(about.history_en||about.history_ur)&&<section className="mt-12 max-w-[780px]"><h2 className="font-serif text-2xl text-navy">{isUr?'ہماری تاریخ':'Our history'}{about.founded?` · ${about.founded}`:''}</h2><p lang={isUr&&about.history_ur?'ur':'en'} dir={isUr&&about.history_ur?'rtl':'ltr'} className="mt-5 whitespace-pre-wrap leading-loose">{pick(about.history_en,about.history_ur)}</p></section>}
        {about.principles.length>0&&<section className="mt-12 grid gap-6 sm:grid-cols-2">{about.principles.map((p,i)=><div key={i} className="border-t border-line pt-5"><h2 className="font-serif text-xl text-navy">{pick(p.title_en,p.title_ur)}</h2><p className="mt-3 whitespace-pre-wrap leading-relaxed">{pick(p.body_en,p.body_ur)}</p></div>)}</section>}

      </section>
    </div>
  );
}
