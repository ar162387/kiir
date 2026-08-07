"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ChevronDown } from "@/components/icons";
import type { Program } from "@/lib/types";

interface NavLinkDef {
  href: string;
  label: string;
}

export default function SiteNav({
  programs,
  counts,
}: {
  programs: Program[];
  counts: Record<string, number>;
}) {
  const { t, isUr, pick } = useLanguage();
  const pathname = usePathname();
  const [programsOpen, setProgramsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstDrawerLinkRef = useRef<HTMLAnchorElement>(null);

  const links: NavLinkDef[] = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { href: "/activities", label: t.activitiesNav },
    { href: "/events", label: t.eventsNav },
    { href: "/news", label: t.news },
    { href: "/contact", label: t.contact },
  ];

  useEffect(() => {
    setProgramsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    firstDrawerLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navBtnClass = (active: boolean) =>
    `flex cursor-pointer items-center whitespace-nowrap border-b-2 px-3 py-3 font-mono text-[10.5px] leading-none tracking-[0.11em] uppercase transition-colors duration-150 ${
      active ? "border-cyan text-navy" : "border-transparent text-slate hover:text-navy"
    }`;

  return (
    <nav aria-label="Primary" className="border-b border-line bg-canvas shadow-[0_1px_0_rgba(16,36,59,0.02)]">
      <div className="mx-auto flex max-w-[1520px] items-stretch gap-1 px-4 sm:px-6">
        {/* Desktop links */}
        <div className="hidden items-stretch gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navBtnClass(pathname === l.href)}>
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setProgramsOpen((v) => !v)}
            aria-expanded={programsOpen}
            aria-controls={panelId}
            className={`${navBtnClass(programsOpen)} gap-1.5`}
          >
            {t.ourPrograms}
            <ChevronDown className={`transition-transform duration-150 ${programsOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-haspopup="dialog"
          aria-label="Open menu"
          className="flex h-11 min-w-11 cursor-pointer items-center justify-center text-navy md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex-1" />

        <Link
          href="/contact"
          className="hidden self-center bg-navy px-4.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-canvas transition-colors duration-150 hover:bg-cyan hover:text-navy md:my-2 md:block"
        >
          {t.getInvolved}
        </Link>
      </div>

      {/* Desktop programs mega-panel */}
      {programsOpen && (
        <div id={panelId} className="animate-[kiirDrop_180ms_ease_both] border-t border-line bg-surface">
          <div className="mx-auto grid max-w-[1520px] grid-cols-1 gap-x-7 gap-y-1 px-4 py-5 sm:grid-cols-2 sm:px-6 sm:py-[22px] lg:grid-cols-3">
            <div className="col-span-full mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-teal">
              {t.ourPrograms} · {programs.length}
            </div>
            {programs.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                onClick={() => setProgramsOpen(false)}
                className="group flex items-baseline justify-between gap-2.5 border-t border-line-soft py-2.5 pr-2 transition-[padding] duration-150 hover:bg-tint hover:pl-2"
              >
                <span className={isUr ? "font-urdu text-[16px] text-navy" : "font-serif text-[15.5px] text-navy"}>
                  {pick(p.name, p.name_ur)}
                </span>
                <span className="font-mono text-[11px] text-muted">{counts[p.slug] ?? 0}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 cursor-pointer bg-navy/60"
          />
          <div
            ref={drawerRef}
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-[360px] flex-col overflow-y-auto bg-canvas shadow-xl animate-[kiirFade_200ms_ease_both]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-teal">KIIR</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 cursor-pointer items-center justify-center text-navy"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col px-2 py-3">
              {links.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  ref={i === 0 ? firstDrawerLinkRef : undefined}
                  className={`px-3 py-3 font-mono text-[13px] uppercase tracking-[0.1em] ${
                    pathname === l.href ? "text-navy" : "text-slate"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-line px-5 py-4">
              <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-teal">
                {t.ourPrograms}
              </div>
              <div className="flex flex-col">
                {programs.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/programs/${p.slug}`}
                    className="flex items-baseline justify-between gap-2 border-t border-line-soft py-2.5"
                  >
                    <span className={isUr ? "font-urdu text-[15px] text-navy" : "font-serif text-[14.5px] text-navy"}>
                      {pick(p.name, p.name_ur)}
                    </span>
                    <span className="font-mono text-[10.5px] text-muted">{counts[p.slug] ?? 0}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-auto px-5 py-4">
              <Link
                href="/contact"
                className="block bg-navy px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-canvas"
              >
                {t.getInvolved}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
