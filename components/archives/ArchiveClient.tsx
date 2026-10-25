"use client";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
import NavigationFeedback from "@/components/NavigationFeedback";
import {localePath} from "@/lib/locale-path";
import FieldText from "@/components/FieldText";

import Link from "@/components/LocalizedLink";
import { useLanguage } from "@/components/LanguageProvider";
import Thumb from "@/components/Thumb";
import { formatDate } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/types";
import type { ContentItem } from "@/lib/types";

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
  categoryFilter,
  publicationKind = "all",
  dateFilter = "",
  showPublicationFilters = false,
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
  categoryFilter: string | "all";
  publicationKind?: string | "all";
  dateFilter?: string;
  showPublicationFilters?: boolean;
}) {
  const { t, isUr, pick } = useLanguage();
  const router=useRouter();const[pending,startTransition]=useTransition();

  const archiveHref = (kind: string, date: string) => {
    const params = new URLSearchParams();
    if (kind !== "all") params.set("kind", kind);
    if (date) params.set("date", date);
    const query = params.toString();
    return localePath(`${basePath}${query ? `?${query}` : ""}`,isUr?'ur':'en');
  };
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (publicationKind !== "all") params.set("kind", publicationKind);
    if (dateFilter) params.set("date", dateFilter);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="animate-[kiirFade_220ms_ease_both]">
      <NavigationFeedback pending={pending}/>
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
        {showPublicationFilters ? <div className="flex flex-wrap items-center gap-3 border-b border-line pb-5.5">
          <label className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-teal">Publication type
            <select value={publicationKind} onChange={(event) => { startTransition(()=>router.push(archiveHref(event.target.value, dateFilter))); }} className="ml-2 border border-line bg-surface px-3 py-2 font-sans text-[14px] normal-case tracking-normal text-navy">
              <option value="all">All publications</option><option value="opinion-articles">Opinion Articles</option><option value="research-papers">Research Papers</option><option value="short-stories">Short Stories</option><option value="newsletters">Newsletters</option>
            </select>
          </label>
          <label className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-teal">Date
            <input type="date" value={dateFilter} onChange={(event) => { startTransition(()=>router.push(archiveHref(publicationKind, event.target.value))); }} className="ml-2 border border-line bg-surface px-3 py-2 font-sans text-[14px] normal-case tracking-normal text-navy" aria-label="Filter publications by date" />
          </label>
          <span className="flex-1" /><span className="font-mono text-[10.5px] text-muted">{total} {t.items}</span>
        </div> : <div className="flex justify-end border-b border-line pb-5.5"><span className="font-mono text-[10.5px] text-muted">{total} {t.items}</span></div>}

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
