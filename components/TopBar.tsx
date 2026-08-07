"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { SearchIcon } from "@/components/icons";
import type { OrgSettings } from "@/lib/types";

export default function TopBar({ org }: { org: OrgSettings }) {
  const { lang, setLang, isUr, pick, t } = useLanguage();

  return (
    <div className="bg-navy text-[#C6D2E0]">
      <div className="mx-auto flex min-h-10 max-w-[1520px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
        <div
          className={
            isUr
              ? "py-2 font-urdu text-[13px] leading-relaxed"
              : "py-2 font-mono text-[11px] uppercase tracking-[0.08em]"
          }
        >
          {pick(org.strapline, org.strapline_ur)}
        </div>
        <div className="flex items-center gap-3.5 py-1.5">
          <label className="flex min-w-[160px] items-center gap-2 border border-white/15 bg-white/[0.07] px-2.5 py-[5px] sm:min-w-[190px]">
            <SearchIcon className="flex-none text-[#8FA3B8]" />
            <span className="sr-only">{t.search}</span>
            <input
              type="search"
              placeholder={t.search}
              aria-label={t.search}
              className="w-full min-w-0 bg-transparent text-[12.5px] text-[#F2F4F7] placeholder:text-[#8FA3B8] outline-none"
            />
          </label>
          <div role="group" aria-label="Language" className="flex border border-white/[0.18]">
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`cursor-pointer px-2.5 py-[5px] font-mono text-[10.5px] tracking-[0.08em] transition-colors duration-150 ${
                lang === "en" ? "bg-cyan text-navy" : "bg-transparent text-[#C6D2E0] hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("ur")}
              aria-pressed={lang === "ur"}
              className={`cursor-pointer px-2.5 py-[5px] font-urdu text-[13px] tracking-normal transition-colors duration-150 ${
                lang === "ur" ? "bg-cyan text-navy" : "bg-transparent text-[#C6D2E0] hover:text-white"
              }`}
            >
              اردو
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
