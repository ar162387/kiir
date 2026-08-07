"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import Thumb from "@/components/Thumb";
import { ArrowUpRight, MailIcon, PrinterIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { TYPE_LABEL } from "@/lib/types";
import type { ContentItem, Program } from "@/lib/types";

export default function ArticleClient({
  item,
  categories,
  related,
}: {
  item: ContentItem;
  categories: Program[];
  related: ContentItem[];
}) {
  const { t, lang, isUr, setLang, pick } = useLanguage();

  const body = pick(item.body, item.body_ur) || pick(item.short_description, item.short_description_ur);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const onShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: pick(item.title, item.title_ur), url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const mailHref = `mailto:?subject=${encodeURIComponent(pick(item.title, item.title_ur))}&body=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="animate-[kiirFade_220ms_ease_both]">
      <div className="mx-auto max-w-[1520px] px-4 pt-6.5 sm:px-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
          <Link href="/" className="text-muted hover:text-navy">
            {t.home}
          </Link>{" "}
          / {isUr ? TYPE_LABEL[item.type].ur : TYPE_LABEL[item.type].en} /{" "}
          <span className="text-teal">{categories.map((c) => pick(c.name, c.name_ur)).join(", ")}</span>
        </div>
      </div>

      <article className="mx-auto max-w-[1520px] px-4 pb-16 pt-5 sm:px-6">
        <Thumb
          src={item.thumbnail_url}
          alt=""
          heightClass="h-[clamp(220px,34vw,460px)]"
          sizes="1200px"
        />

        <div className="mt-8.5 flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[3_1_520px]">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/programs/${c.slug}`}
                  className="border border-line bg-tint px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-navy transition-colors duration-150 hover:border-cyan hover:bg-cyan"
                >
                  {pick(c.name, c.name_ur)}
                </Link>
              ))}
            </div>

            <h1
              className={
                isUr
                  ? "mt-5 max-w-[26ch] font-urdu text-[clamp(26px,3.2vw,40px)] leading-[2] text-navy"
                  : "mt-5 max-w-[26ch] font-serif text-[clamp(32px,4vw,52px)] leading-[1.08] tracking-[-0.02em] text-navy"
              }
            >
              {pick(item.title, item.title_ur)}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-line py-3.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate">
                {formatDate(item.item_date, isUr ? "ur" : "en")}
              </span>
              <span className="block h-[3px] w-[3px] bg-cyan" />
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate">
                {isUr ? TYPE_LABEL[item.type].ur : TYPE_LABEL[item.type].en}
              </span>
              <span className="flex-1" />
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{t.readIn}</span>
                <span className="flex border border-line">
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`cursor-pointer px-3 py-1.5 font-mono text-[10.5px] uppercase transition-colors duration-150 ${
                      lang === "en" ? "bg-navy text-canvas" : "text-slate"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("ur")}
                    className={`cursor-pointer px-3 py-1.5 font-urdu text-[13px] transition-colors duration-150 ${
                      lang === "ur" ? "bg-navy text-canvas" : "text-slate"
                    }`}
                  >
                    اردو
                  </button>
                </span>
              </span>
            </div>

            <p
              className={
                isUr
                  ? "mt-6.5 mb-5.5 font-urdu text-[19px] leading-[2.5] text-navy"
                  : "mt-6.5 mb-5.5 font-serif text-[20.5px] leading-[1.6] text-navy"
              }
            >
              {pick(item.short_description, item.short_description_ur)}
            </p>

            {/* eslint-disable-next-line react/no-danger -- trusted seed/admin content; sanitize (e.g. DOMPurify) before allowing untrusted authors */}
            <div
              className={`article-body ${isUr ? "article-body--ur" : ""}`}
              dir={isUr ? "rtl" : "ltr"}
              dangerouslySetInnerHTML={{ __html: body }}
            />

            <div className="mt-9 flex flex-wrap items-center gap-2.5 border-t border-line pt-4.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{t.share}</span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={onShare}
                  aria-label={t.share}
                  className="grid h-8 w-8 cursor-pointer place-items-center border border-line text-slate hover:border-navy hover:text-navy"
                >
                  <ArrowUpRight />
                </button>
                <a
                  href={mailHref}
                  aria-label="Email this item"
                  className="grid h-8 w-8 place-items-center border border-line text-slate hover:border-navy hover:text-navy"
                >
                  <MailIcon />
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  aria-label="Print this item"
                  className="grid h-8 w-8 cursor-pointer place-items-center border border-line text-slate hover:border-navy hover:text-navy"
                >
                  <PrinterIcon />
                </button>
              </span>
            </div>
          </div>

          <aside className="sticky top-29 flex min-w-0 flex-[1_1_280px] flex-col gap-6.5">
            {related.length > 0 && (
              <section className="border border-line p-5">
                <h2 className="m-0 mb-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-teal">
                  {t.related}
                </h2>
                <div className="flex flex-col">
                  {related.map((r) => {
                    const rCats = categories.filter((c) => r.categories.includes(c.slug));
                    return (
                      <Link
                        key={r.slug}
                        href={`/articles/${r.slug}`}
                        className="group flex gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0"
                      >
                        <Thumb
                          src={r.thumbnail_url}
                          alt=""
                          widthClass="w-16"
                          heightClass="h-16"
                          sizes="64px"
                          fallbackLabel=""
                        />
                        <div className="min-w-0">
                          <span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-teal">
                            {rCats[0] ? pick(rCats[0].name, rCats[0].name_ur) : ""}
                          </span>
                          <span
                            className={
                              isUr
                                ? "mt-1 block font-urdu text-[14px] leading-[1.7] text-navy"
                                : "mt-1 line-clamp-2 block font-serif text-[13.5px] leading-[1.3] text-navy"
                            }
                          >
                            {pick(r.title, r.title_ur)}
                          </span>
                          <span className="mt-1 block font-mono text-[9.5px] text-muted">
                            {formatDate(r.item_date, isUr ? "ur" : "en")}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
            <section className="border border-line p-5">
              <h2 className="m-0 mb-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-teal">
                {t.metadata}
              </h2>
              <MetaRow k={isUr ? "شائع شدہ" : "Published"} v={formatDate(item.item_date, isUr ? "ur" : "en")} />
              <MetaRow k={isUr ? "قسم" : "Type"} v={isUr ? TYPE_LABEL[item.type].ur : TYPE_LABEL[item.type].en} />
              <MetaRow k={isUr ? "پروگرام" : "Programs"} v={categories.map((c) => pick(c.name, c.name_ur)).join(", ") || "—"} />
              <MetaRow k={isUr ? "زبانیں" : "Languages"} v={item.title_ur ? "EN · UR" : "EN"} />
            </section>
            <section className="bg-tint p-5.5">
              <h2 className={isUr ? "m-0 font-urdu text-[19px] leading-[2] text-navy" : "m-0 font-serif text-[19px] leading-tight text-navy"}>
                {t.supportTitle}
              </h2>
              <p className={isUr ? "mt-2.5 mb-4 font-urdu text-[13px] leading-[2.2] text-slate" : "mt-2.5 mb-4 text-[13px] leading-relaxed text-slate"}>
                {t.supportBody}
              </p>
              <Link
                href="/contact"
                className="block w-full bg-navy px-3 py-3 text-center font-mono text-[10.5px] uppercase tracking-[0.12em] text-canvas transition-colors duration-150 hover:bg-cyan hover:text-navy"
              >
                {t.supportBtn}
              </Link>
            </section>
          </aside>
        </div>
      </article>
    </div>
  );
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-line-soft py-2 font-mono text-[11px]">
      <span className="text-muted">{k}</span>
      <span className="text-right text-navy">{v}</span>
    </div>
  );
}
