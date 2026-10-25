"use client";
import FieldText from "@/components/FieldText";

import Link from "@/components/LocalizedLink";
import { useLanguage } from "@/components/LanguageProvider";
import Thumb from "@/components/Thumb";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/types";
import type { ContentItem, ContentType, Program } from "@/lib/types";

type TypeFilter = ContentType | "all";

const FILTERS: TypeFilter[] = ["all", "activity", "event", "news_publication"];

export default function ProgramClient({
  program,
  items,
  total,
  page,
  pageCount,
  typeFilter,
  stats,
}: {
  program: Program;
  items: ContentItem[];
  total: number;
  page: number;
  pageCount: number;
  typeFilter: TypeFilter;
  stats: { total: number; activity: number; event: number; publication: number };
}) {
  const { t, isUr } = useLanguage();

  const nameUr=isUr&&Boolean(program.name_ur?.trim());
  const introUr=isUr&&Boolean(program.long_description_ur?.trim());

  const filterHref = (f: TypeFilter) => (f === "all" ? `/programs/${program.slug}` : `/programs/${program.slug}?type=${f}`);

  return (
    <div className="animate-[kiirFade_220ms_ease_both]">
      <section className="relative overflow-hidden bg-navy text-[#E8EDF3]">
        {program.image_url && (
          <span
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(11,43,56,0.96) 0%, rgba(11,43,56,0.8) 60%, rgba(11,43,56,0.62) 100%), url("${program.image_url}")`,
            }}
          />
        )}
        <div className="relative mx-auto max-w-[1520px] px-4 py-10 sm:px-6 sm:py-11.5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#8FA3B8]">
            <Link href="/" className="text-[#8FA3B8] hover:text-white">
              {t.home}
            </Link>{" "}
            / {t.ourPrograms} / <span className="text-cyan"><FieldText en={program.name} ur={program.name_ur} serif/></span>
          </div>
          <div className="mt-5.5 flex flex-wrap items-end gap-10">
            <h1 lang={nameUr?"ur":"en"} dir={nameUr?"rtl":"ltr"}
              className={
                nameUr
                  ? "m-0 flex-[1_1_420px] font-urdu text-[clamp(28px,3.6vw,46px)] leading-[1.9] text-white"
                  : "m-0 flex-[1_1_420px] font-serif text-[clamp(34px,4.6vw,58px)] leading-[1.05] tracking-[-0.02em] text-white"
              }
            >
              <FieldText en={program.name} ur={program.name_ur} serif/>
            </h1>
            <p lang={introUr?"ur":"en"} dir={introUr?"rtl":"ltr"}
              className={
                introUr
                  ? "m-0 flex-[1_1_320px] font-urdu text-sm leading-[2.3] text-[#B9C7D6]"
                  : "m-0 max-w-[56ch] flex-[1_1_320px] text-[15px] leading-relaxed text-[#B9C7D6]"
              }
            >
              <FieldText en={program.long_description} ur={program.long_description_ur}/>
            </p>
          </div>
          <div className="mt-7.5 flex flex-wrap gap-7 border-t border-white/15 pt-4.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#8FA3B8]">
            <span>{stats.total} {t.tagged}</span>
            <span>{stats.activity} {t.activities}</span>
            <span>{stats.event} {t.events}</span>
            <span>{stats.publication} {t.publications}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1520px] px-4 py-7.5 pb-16 sm:px-6">
        <div role="group" aria-label="Filter by type" className="flex flex-wrap items-center gap-2 border-b border-line pb-5.5">
          <span className="mr-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{t.filter}</span>
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={filterHref(f)}
              className={`cursor-pointer border px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors duration-150 ${
                typeFilter === f ? "border-navy bg-navy text-canvas" : "border-line bg-transparent text-slate hover:border-navy/40"
              }`}
            >
              {f === "all" ? t.allTypes : isUr ? TYPE_LABEL[f].ur : TYPE_LABEL[f].en}
            </Link>
          ))}
          <span className="flex-1" />
          <span className="font-mono text-[10.5px] text-muted">
            {total} {t.items}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">—</p>
        ) : (
          <div className="grid grid-cols-1 gap-6.5 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <Link
                key={it.slug}
                href={`/articles/${it.slug}`}
                className="group flex flex-col border border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-cyan hover:shadow-[0_14px_30px_-20px_rgba(16,36,59,0.5)]"
              >
                <Thumb src={it.thumbnail_url} alt="" heightClass="h-37.5" />
                <span className="block px-4.5 pb-5 pt-4">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal">
                      {isUr ? TYPE_LABEL[it.type].ur : TYPE_LABEL[it.type].en}
                    </span>
                    <span className="block h-[3px] w-[3px] bg-cyan" />
                    <span className="font-mono text-[9.5px] text-muted">{formatDate(it.item_date, isUr ? "ur" : "en")}</span>
                  </span>
                  <span className={isUr ? "mt-2 block font-urdu text-[17px] leading-[2.1] text-navy" : "mt-2 block font-serif text-[19px] leading-[1.25] text-navy"}>
                    <FieldText en={it.title} ur={it.title_ur} serif/>
                  </span>
                  <span className={isUr ? "mt-2 block font-urdu text-[13px] leading-[2.2] text-slate" : "mt-2 block text-[13.5px] leading-relaxed text-slate"}>
                    <FieldText en={it.short_description} ur={it.short_description_ur}/>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-11 flex flex-wrap items-center justify-center gap-2">
            <Link
              aria-disabled={page <= 1}
              href={pageHref(program.slug, typeFilter, page - 1)}
              className={`grid h-10 w-10 place-items-center border font-mono text-xs ${
                page <= 1 ? "pointer-events-none border-line text-muted/50" : "border-line text-slate hover:border-navy"
              }`}
            >
              <ArrowLeft />
            </Link>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(program.slug, typeFilter, n)}
                aria-current={page === n ? "page" : undefined}
                className={`grid h-10 w-10 place-items-center border font-mono text-xs ${
                  page === n ? "border-navy bg-navy text-canvas" : "border-line text-slate hover:border-navy/40"
                }`}
              >
                {n}
              </Link>
            ))}
            <Link
              aria-disabled={page >= pageCount}
              href={pageHref(program.slug, typeFilter, page + 1)}
              className={`grid h-10 w-10 place-items-center border font-mono text-xs transition-colors duration-150 ${
                page >= pageCount ? "pointer-events-none border-line text-muted/50" : "border-navy text-navy hover:bg-navy hover:text-canvas"
              }`}
            >
              <ArrowRight />
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}

function pageHref(slug: string, type: TypeFilter, page: number) {
  const params = new URLSearchParams();
  if (type !== "all") params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/programs/${slug}${qs ? `?${qs}` : ""}`;
}
