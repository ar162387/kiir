"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Diamond } from "@/components/icons";
import type { TickerItem } from "@/lib/types";

export default function NewsTicker({ items }: { items: TickerItem[] }) {
  const { t, isUr, pick } = useLanguage();
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;

  const duration = 28 + items.length * 6;

  return (
    <div
      role="region"
      aria-label="News ticker"
      aria-live="polite"
      className="border-b border-white/10 shadow-[0_6px_18px_-14px_rgba(69,17,27,0.6)]"
      style={{ backgroundColor: "#6f1d2b" }}
    >
      <div className={`mx-auto flex max-w-[1520px] items-center gap-4.5 px-4 sm:px-6 ${isUr ? "h-13" : "h-[42px]"}`}>
        <span className="hidden flex-none items-center gap-2 bg-cyan px-2.5 py-[5px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#05202B] sm:flex">
          <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-[#05202B]" />
          {t.ticker}
        </span>
        <div
          className="min-w-0 flex-1 overflow-hidden"
          style={{ maskImage: "linear-gradient(90deg, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)" }}
        >
          <div
            className="flex w-max items-center gap-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
              animation: `kiirMarquee ${duration}s linear infinite`,
              animationDirection: isUr ? "reverse" : "normal",
              animationPlayState: paused ? "paused" : "running",
              direction: isUr ? "rtl" : "ltr",
            }}
          >
            {[items, items].map((set, dupeIdx) => (
              <div key={dupeIdx} className="flex items-center gap-14" aria-hidden={dupeIdx === 1} {...(dupeIdx === 1 ? { tabIndex: -1 } : {})}>
                {set.map((n, i) => (
                  <Link
                    key={`${dupeIdx}-${i}`}
                    href={`/articles/${n.slug}`}
                    tabIndex={dupeIdx === 1 ? -1 : undefined}
                    className={
                      isUr
                        ? "flex flex-none items-center whitespace-nowrap font-urdu text-[14px] leading-9 text-[#E8EDF3]"
                        : "flex flex-none items-center whitespace-nowrap text-[13.5px] leading-[22px] text-[#E8EDF3]"
                    }
                  >
                    <Diamond className="mr-3 flex-none text-cyan" />
                    {pick(n.text, n.text_ur)}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
