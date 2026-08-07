"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import Thumb from "@/components/Thumb";
import Chip from "@/components/Chip";
import { ArrowRight, ChevronLeft, ChevronRight } from "@/components/icons";
import { formatDate, formatMonthDay } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/types";
import type { ContentItem, Program } from "@/lib/types";

const HERO_INTERVAL = 6500;
const FEED_PAGE = 8;

export default function HomeClient({
  featured,
  feed,
  programs,
  upcoming,
  publications,
  counts,
}: {
  featured: ContentItem[];
  feed: ContentItem[];
  programs: Program[];
  upcoming: ContentItem[];
  publications: ContentItem[];
  counts: Record<string, number>;
}) {
  const { t, isUr, pick } = useLanguage();
  const [heroIdx, setHeroIdx] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [visible, setVisible] = useState(FEED_PAGE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const len = featured.length || 1;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (featured.length <= 1) return;
    timerRef.current = setInterval(() => {
      setHeroIdx((i) => (i + 1 + len) % len);
    }, HERO_INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured.length]);

  const navHero = (n: number) => {
    setHeroIdx(((n % len) + len) % len);
    startTimer();
  };

  const lead = featured[heroIdx % len];
  const rest = useMemo(() => {
    if (!featured.length) return [];
    return [...featured.slice((heroIdx % len) + 1), ...featured.slice(0, heroIdx % len)];
  }, [featured, heroIdx, len]);

  const filteredFeed = useMemo(
    () => (filter === "all" ? feed : feed.filter((i) => i.categories.includes(filter))),
    [feed, filter]
  );
  const shown = filteredFeed.slice(0, visible);

  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* Featured */}
      {/* ---------------------------------------------------------------- */}
      {lead && (
        <section aria-label="Featured" className="mx-auto max-w-[1520px] px-4 pt-9 pb-2 sm:px-6">
          <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-navy pb-2.5">
            <h2 className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
              {t.featured}
            </h2>
            <span className="font-mono text-[11px] text-muted">
              {featured.length} {t.curated}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.75fr_1fr_1fr] lg:auto-rows-[minmax(178px,auto)]">
            {/* Lead */}
            <div className="relative col-span-full flex min-h-[300px] sm:min-h-[380px] lg:col-span-1 lg:col-start-1 lg:row-span-2">
              <Link
                key={lead.slug}
                href={`/articles/${lead.slug}`}
                className="relative flex flex-1 overflow-hidden transition-shadow duration-200"
              >
                {lead.thumbnail_url ? (
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-[kiirHeroImg_900ms_ease_both] bg-cover bg-center"
                    style={{ backgroundImage: `url("${lead.thumbnail_url}")` }}
                  />
                ) : (
                  <span aria-hidden className="absolute inset-0 bg-navy" />
                )}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,22,36,0.15) 0%, rgba(10,22,36,0.55) 45%, rgba(10,22,36,0.92) 100%)",
                  }}
                />
                <span className="relative block animate-[kiirHeroA_700ms_cubic-bezier(0.22,0.61,0.36,1)_both] self-end px-5 pb-8 pt-5 sm:px-6.5">
                  <span className="mb-3.5 flex flex-wrap gap-2">
                    <span className="bg-cyan px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-navy">
                      {pick(...programLabel(programs, lead.categories[0]))}
                    </span>
                    <span className="border border-white/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#EAEFF5]">
                      {isUr ? TYPE_LABEL[lead.type].ur : TYPE_LABEL[lead.type].en}
                    </span>
                  </span>
                  <span
                    className={
                      isUr
                        ? "block font-urdu text-[22px] leading-[2] text-white sm:text-[30px]"
                        : "block max-w-[22ch] font-serif text-[26px] leading-[1.1] tracking-[-0.01em] text-white sm:text-[36px]"
                    }
                  >
                    {pick(lead.title, lead.title_ur)}
                  </span>
                  <span
                    className={
                      isUr
                        ? "mt-3 block font-urdu text-[14px] leading-[2.1] text-[#C8D3DF]"
                        : "mt-3 block max-w-[52ch] text-sm leading-relaxed text-[#C8D3DF]"
                    }
                  >
                    {pick(lead.short_description, lead.short_description_ur)}
                  </span>
                  <span className="mt-3.5 block font-mono text-[11px] text-[#A9B8C7]">
                    {formatDate(lead.item_date, isUr ? "ur" : "en")}
                  </span>
                </span>
              </Link>

              {featured.length > 1 && (
                <div
                  role="group"
                  aria-label="Featured story navigation"
                  className="absolute bottom-4 right-4 z-[3] flex items-center gap-2.5 border border-white/22 bg-[rgba(8,26,36,0.42)] px-2.5 py-2 backdrop-blur-[8px]"
                >
                  <button
                    type="button"
                    aria-label="Previous featured story"
                    onClick={() => navHero((heroIdx % len) - 1)}
                    className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center border border-white/28 text-[#EAEFF5] transition-colors duration-150 hover:border-cyan hover:bg-cyan hover:text-navy"
                  >
                    <ChevronLeft />
                  </button>
                  <span className="flex items-center gap-1.5">
                    {featured.map((f, i) => (
                      <button
                        key={f.slug}
                        type="button"
                        aria-label={`${i + 1} of ${featured.length}`}
                        onClick={() => navHero(i)}
                        className="h-1.5 cursor-pointer border-none p-0 transition-[width,background] duration-300"
                        style={{
                          width: i === heroIdx % len ? 18 : 6,
                          background: i === heroIdx % len ? "var(--color-cyan)" : "rgba(255,255,255,0.42)",
                        }}
                      />
                    ))}
                  </span>
                  <button
                    type="button"
                    aria-label="Next featured story"
                    onClick={() => navHero((heroIdx % len) + 1)}
                    className="flex h-6.5 w-6.5 cursor-pointer items-center justify-center border border-white/28 text-[#EAEFF5] transition-colors duration-150 hover:border-cyan hover:bg-cyan hover:text-navy"
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>

            {rest.slice(0, 4).map((f) => (
              <Link
                key={f.slug}
                href={`/articles/${f.slug}`}
                className="group relative flex flex-col overflow-hidden border border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-cyan hover:shadow-[0_12px_28px_-18px_rgba(16,36,59,0.45)]"
              >
                <Thumb src={f.thumbnail_url} alt="" heightClass="h-33" />
                <span className="block px-4 pb-4.5 pt-3.5">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal">
                    {pick(...programLabel(programs, f.categories[0]))}
                  </span>
                  <span className={isUr ? "mt-2 block font-urdu text-[17px] leading-[2.1] text-navy" : "mt-2 block font-serif text-[17px] leading-[1.27] tracking-[-0.005em] text-navy"}>
                    {pick(f.title, f.title_ur)}
                  </span>
                  <span className="mt-2.5 block font-mono text-[10.5px] text-muted">
                    {formatDate(f.item_date, isUr ? "ur" : "en")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Latest + sidebar */}
      {/* ---------------------------------------------------------------- */}
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-start gap-10 px-4 py-11 sm:px-6">
        <section aria-label="Latest" className="min-w-0 flex-[3_1_520px]">
          <div className="flex items-baseline justify-between gap-4 border-b border-navy pb-2.5">
            <h2 className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
              {t.latest}
            </h2>
            <span className="font-mono text-[11px] text-muted">{t.showing(shown.length, filteredFeed.length)}</span>
          </div>
          <div role="group" aria-label="Filter by program" className="flex flex-wrap gap-2 py-4 pb-5.5">
            <Chip active={filter === "all"} onClick={() => { setFilter("all"); setVisible(FEED_PAGE); }}>
              {t.all}
            </Chip>
            {programs.map((p) => (
              <Chip
                key={p.slug}
                active={filter === p.slug}
                isUr={isUr}
                onClick={() => { setFilter(p.slug); setVisible(FEED_PAGE); }}
              >
                {pick(p.name, p.name_ur)}
              </Chip>
            ))}
          </div>
          <div className="flex flex-col">
            {shown.map((it) => (
              <Link
                key={it.slug}
                href={`/articles/${it.slug}`}
                className="group flex items-start gap-4 border-t border-line py-5 transition-colors duration-150 hover:bg-tint sm:gap-5"
              >
                <Thumb
                  src={it.thumbnail_url}
                  alt=""
                  widthClass="w-24 sm:w-50"
                  heightClass="h-16 sm:h-32"
                  fallbackLabel="no thumbnail"
                  sizes="200px"
                />
                <span className="min-w-0 flex-[1_1_260px]">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal">
                      {pick(...programLabel(programs, it.categories[0]))}
                    </span>
                    <span className="block h-[3px] w-[3px] bg-cyan" />
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
                      {isUr ? TYPE_LABEL[it.type].ur : TYPE_LABEL[it.type].en}
                    </span>
                  </span>
                  <span className={isUr ? "mt-2 block font-urdu text-[16px] leading-[2.1] text-navy" : "mt-2 block font-serif text-[21px] leading-[1.27] tracking-[-0.005em] text-navy"}>
                    {pick(it.title, it.title_ur)}
                  </span>
                  <span className={isUr ? "mt-2 block font-urdu text-[14.5px] leading-[2.2] text-slate" : "mt-2 block text-[14px] leading-relaxed text-slate"}>
                    {pick(it.short_description, it.short_description_ur)}
                  </span>
                  <span className="mt-2.5 block font-mono text-[10.5px] text-muted">
                    {formatDate(it.item_date, isUr ? "ur" : "en")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          {visible < filteredFeed.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + FEED_PAGE)}
              className="mt-6.5 w-full cursor-pointer border border-navy bg-transparent px-3.5 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy transition-colors duration-150 hover:bg-navy hover:text-canvas"
            >
              {t.loadMore}
            </button>
          )}
        </section>

        <aside aria-label="Secondary" className="sticky top-29 flex min-w-0 flex-[1_1_300px] flex-col gap-7.5">
          <section>
            <h2 className="m-0 mb-3 border-b border-navy pb-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
              {t.upcoming}
            </h2>
            {upcoming.length === 0 && <p className="py-3 text-sm text-muted">—</p>}
            {upcoming.map((e) => {
              const { mon, day } = formatMonthDay(e.item_date);
              return (
                <Link
                  key={e.slug}
                  href={`/articles/${e.slug}`}
                  className="flex items-start gap-3.5 border-b border-line py-3.5 transition-colors duration-150 hover:bg-tint"
                >
                  <span className="flex-none border border-cyan px-0 py-1.5 text-center w-11.5">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-teal">{mon}</span>
                    <span className="block font-serif text-[19px] leading-tight text-navy">{day}</span>
                  </span>
                  <span className="min-w-0">
                    <span className={isUr ? "block font-urdu text-[15px] leading-[2] text-navy" : "block font-serif text-[15px] leading-tight text-navy"}>
                      {pick(e.title, e.title_ur)}
                    </span>
                    <span className="mt-1.5 block font-mono text-[10px] text-muted">
                      {pick(...programLabel(programs, e.categories[0]))}
                    </span>
                  </span>
                </Link>
              );
            })}
          </section>

          <section>
            <h2 className="m-0 mb-3 border-b border-navy pb-2.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-navy">
              {t.recentPubs}
            </h2>
            {publications.map((p) => (
              <Link key={p.slug} href={`/articles/${p.slug}`} className="block border-b border-line py-3.5 transition-colors duration-150 hover:bg-tint">
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal">
                  {pick(...programLabel(programs, p.categories[0]))}
                </span>
                <span className={isUr ? "mt-1.5 block font-urdu text-[16px] leading-[2.1] text-navy" : "mt-1.5 block font-serif text-[15.5px] leading-[1.27] text-navy"}>
                  {pick(p.title, p.title_ur)}
                </span>
                <span className="mt-1.5 block font-mono text-[10px] text-muted">
                  {formatDate(p.item_date, isUr ? "ur" : "en")}
                </span>
              </Link>
            ))}
          </section>

          <section className="bg-navy p-6 text-[#E8EDF3]">
            <h2 className={isUr ? "m-0 font-urdu text-[22px] leading-[2] text-white" : "m-0 font-serif text-[22px] leading-tight text-white"}>
              {t.getInvolved}
            </h2>
            <p className={isUr ? "mt-3 font-urdu text-[13.5px] leading-[2.2] text-[#B9C7D6]" : "mt-3 text-[13.5px] leading-relaxed text-[#B9C7D6]"}>
              {t.giBody}
            </p>
            <div className="mt-4.5 flex flex-col gap-2">
              <Link
                href="/contact"
                className="bg-cyan px-3 py-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-navy transition-[filter] duration-150 hover:brightness-110"
              >
                {t.contactBtn}
              </Link>
              <Link
                href="/contact"
                className="border border-white/30 px-3 py-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#E8EDF3] transition-colors duration-150 hover:bg-white/[0.08]"
              >
                {t.subscribe}
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Programs */}
      {/* ---------------------------------------------------------------- */}
      <section aria-label="Our Programs" className="border-y border-line bg-tint">
        <div className="mx-auto max-w-[1520px] px-4 py-13 sm:px-6">
          <div className="mb-6.5 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-teal">{t.ourPrograms}</div>
              <h2 className="mt-2.5 max-w-[24ch] font-serif text-[28px] leading-[1.12] tracking-[-0.015em] text-navy sm:text-[38px]">
                {t.programsHeadline}
              </h2>
            </div>
            <p className="m-0 max-w-[40ch] text-sm leading-relaxed text-[#455760]">{t.programsIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {programs.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group flex min-h-47.5 flex-col gap-3 bg-canvas pb-6 transition-colors duration-200 hover:bg-surface"
              >
                <span className="block h-33 w-full overflow-hidden bg-thumb">
                  <span
                    aria-hidden
                    className="block h-full w-full bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-110"
                    style={p.image_url ? { backgroundImage: `url("${p.image_url}")` } : undefined}
                  />
                </span>
                <span className={isUr ? "block px-5.5 font-urdu text-[18px] leading-[2.1] text-navy" : "block px-5.5 font-serif text-[19px] leading-[1.22] text-navy"}>
                  {pick(p.name, p.name_ur)}
                </span>
                <span className={isUr ? "block px-5.5 font-urdu text-[12.5px] leading-[2.2] text-slate" : "block px-5.5 text-[13px] leading-relaxed text-slate"}>
                  {pick(p.description, p.description_ur)}
                </span>
                <span className="flex-1" />
                <span className="mx-5.5 flex items-center justify-between gap-2.5 border-t border-line-soft pt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-teal">
                  <span>
                    {counts[p.slug] ?? 0} {t.items}
                  </span>
                  <ArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function programLabel(programs: Program[], slug: string | undefined): [string, string] {
  const p = programs.find((x) => x.slug === slug);
  return [p?.name ?? "", p?.name_ur ?? ""];
}
