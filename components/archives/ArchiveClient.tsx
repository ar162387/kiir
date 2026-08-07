"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import Thumb from "@/components/Thumb";
import { formatDate } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/types";
import type { ContentItem, Program } from "@/lib/types";

export default function ArchiveClient({
  basePath,
  titleEn,
  titleUr,
  descriptionEn,
  descriptionUr,
  items,
  total,
  page,
  pageCount,
  programs,
  categoryFilter,
}: {
  basePath: string;
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  items: ContentItem[];
  total: number;
  page: number;
  pageCount: number;
  programs: Program[];
  categoryFilter: string | "all";
}) {
  const { t, isUr, pick } = useLanguage();

  const catHref = (slug: string) => (slug === "all" ? basePath : `${basePath}?category=${slug}`);
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="animate-[kiirFade_220ms_ease_both]">
      <section className="border-b border-line bg-tint">
        <div className="mx-auto max-w-[1520px] px-4 py-10 sm:px-6 sm:py-12">
          <h1 className={isUr ? "m-0 font-urdu text-[32px] leading-[2] text-navy" : "m-0 font-serif text-[clamp(30px,4vw,46px)] leading-[1.08] tracking-[-0.02em] text-navy"}>
            {pick(titleEn, titleUr)}
          </h1>
          <p className={isUr ? "mt-3 max-w-[60ch] font-urdu text-sm leading-[2.2] text-slate" : "mt-3 max-w-[60ch] text-[15px] leading-relaxed text-slate"}>
            {pick(descriptionEn, descriptionUr)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1520px] px-4 py-7.5 pb-16 sm:px-6">
        <div role="group" aria-label="Filter by program" className="flex flex-wrap items-center gap-2 border-b border-line pb-5.5">
          <Link
            href={catHref("all")}
            className={`cursor-pointer border px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors duration-150 ${
              categoryFilter === "all" ? "border-navy bg-navy text-canvas" : "border-line bg-transparent text-slate hover:border-navy/40"
            }`}
          >
            {t.all}
          </Link>
          {programs.map((p) => (
            <Link
              key={p.slug}
              href={catHref(p.slug)}
              className={`cursor-pointer border px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors duration-150 ${
                isUr ? "font-urdu normal-case tracking-normal" : ""
              } ${categoryFilter === p.slug ? "border-navy bg-navy text-canvas" : "border-line bg-transparent text-slate hover:border-navy/40"}`}
            >
              {pick(p.name, p.name_ur)}
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
                    {pick(it.title, it.title_ur)}
                  </span>
                  <span className={isUr ? "mt-2 block font-urdu text-[13px] leading-[2.2] text-slate" : "mt-2 block text-[13.5px] leading-relaxed text-slate"}>
                    {pick(it.short_description, it.short_description_ur)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-11 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={page === n ? "page" : undefined}
                className={`grid h-10 w-10 place-items-center border font-mono text-xs ${
                  page === n ? "border-navy bg-navy text-canvas" : "border-line text-slate hover:border-navy/40"
                }`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
