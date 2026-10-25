"use client";

import Link from "@/components/LocalizedLink";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ChevronDown } from "@/components/icons";
import type { Program } from "@/lib/types";

const publicationLinks = [
  { kind: "opinion-articles", label: "Opinion Articles",labelUr:"رائے کے مضامین" },
  { kind: "research-papers", label: "Research Papers",labelUr:"تحقیقی مقالے" },
  { kind: "short-stories", label: "Short Stories",labelUr:"مختصر کہانیاں" },
  { kind: "newsletters", label: "Newsletters",labelUr:"نیوز لیٹر" },
];

export default function SiteNav({ programs }: { programs: Program[] }) {
  const { t,pick } = useLanguage();
  const pathname = usePathname().replace(/^\/ur(?=\/|$)/,'')||'/';
  const [publicationsOpen, setPublicationsOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();
  const firstDrawerLinkRef = useRef<HTMLAnchorElement>(null);

  const links = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { href: "/activities", label: t.activitiesNav },
    { href: "/events", label: t.eventsNav },
    {href:"/contact",label:t.contactCol},
  ];

  useEffect(() => {
    if (!mobileOpen) return;
    firstDrawerLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navClass = (active: boolean) =>
    `kiir-primary-nav-link flex items-center whitespace-nowrap border px-4 py-3 font-display text-[13px] uppercase leading-none tracking-[0.03em] transition-colors ${
      active ? "kiir-primary-nav-link--active" : ""
    }`;
  const navStyle = (active: boolean) => ({
    backgroundColor: active ? "#06355f" : "#0b4f8a",
    borderColor: "rgba(5, 46, 83, 0.6)",
    color: "#ffffff",
  });

  return (
    <nav aria-label="Primary" className="kiir-primary-nav border-b shadow-[0_1px_0_rgba(16,36,59,0.08)]" style={{ backgroundColor: "#083d6c", borderColor: "#052e53" }}>
      <div className="mx-auto flex max-w-[1520px] items-stretch px-4 sm:px-6">
        <div className="hidden items-stretch gap-1 py-1.5 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navClass(pathname === link.href)} style={navStyle(pathname === link.href)}>{link.label}</Link>
          ))}
          <div className="relative" onMouseEnter={() => setProgramsOpen(true)} onMouseLeave={() => setProgramsOpen(false)}>
            <button type="button" onClick={() => setProgramsOpen((value) => !value)} aria-expanded={programsOpen} className={`${navClass(programsOpen || pathname.startsWith("/programs/"))} cursor-pointer gap-2`} style={navStyle(programsOpen || pathname.startsWith("/programs/"))}>
              {t.ourPrograms}<ChevronDown className={`transition-transform ${programsOpen ? "rotate-180" : ""}`} />
            </button>
            {programsOpen && <div className="absolute left-0 top-full z-50 w-72 overflow-hidden border border-blue-950/30 bg-white p-1.5 shadow-xl">
              {programs.map((program) => <Link key={program.slug} href={`/programs/${program.slug}`} onClick={() => setProgramsOpen(false)} className="block px-4 py-3 text-[15px] font-semibold text-navy hover:bg-tint hover:text-teal">{pick(program.name,program.name_ur)}</Link>)}
            </div>}
          </div>
          <div className="relative" onMouseEnter={() => setPublicationsOpen(true)} onMouseLeave={() => setPublicationsOpen(false)}>
            <button type="button" onClick={() => setPublicationsOpen((value) => !value)} aria-expanded={publicationsOpen} aria-controls={panelId} className={`${navClass(pathname === "/publications" || publicationsOpen)} cursor-pointer gap-2`} style={navStyle(pathname === "/publications" || publicationsOpen)}>
              {t.news}<ChevronDown className={`transition-transform ${publicationsOpen ? "rotate-180" : ""}`} />
            </button>
            {publicationsOpen && <div id={panelId} className="absolute left-0 top-full z-50 w-64 overflow-hidden border border-blue-950/30 bg-white p-1.5 shadow-xl">
              {publicationLinks.map((item) => <Link key={item.kind} href={`/publications?kind=${item.kind}`} onClick={() => setPublicationsOpen(false)} className="block px-4 py-3 text-[15px] font-semibold text-navy hover:bg-tint hover:text-teal">{pick(item.label,item.labelUr)}</Link>)}
            </div>}
          </div>
        </div>

        <button type="button" onClick={() => setMobileOpen(true)} aria-haspopup="dialog" aria-label="Open menu" className="flex h-12 min-w-12 items-center justify-center text-white md:hidden">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-navy/60" />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-[360px] flex-col overflow-y-auto bg-canvas shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4"><span className="font-display text-sm text-navy">KIIR</span><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="h-11 w-11 text-navy">×</button></div>
            <div className="flex flex-col p-3">
              {links.map((link, index) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} ref={index === 0 ? firstDrawerLinkRef : undefined} className="border-b border-line px-3 py-3 font-display text-[14px] uppercase text-navy">{link.label}</Link>)}
              <span className="px-3 pt-5 font-display text-[14px] uppercase text-navy">{t.ourPrograms}</span>
              {programs.map((program) => <Link key={program.slug} href={`/programs/${program.slug}`} onClick={() => setMobileOpen(false)} className="border-b border-line px-5 py-2.5 text-[15px] font-semibold text-slate">{pick(program.name,program.name_ur)}</Link>)}
              <Link href="/publications" onClick={() => setMobileOpen(false)} className="px-3 pt-5 font-display text-[14px] uppercase text-navy">{t.news}</Link>
              {publicationLinks.map((item) => <Link key={item.kind} href={`/publications?kind=${item.kind}`} onClick={() => setMobileOpen(false)} className="border-b border-line px-5 py-2.5 text-[15px] font-semibold text-slate">{pick(item.label,item.labelUr)}</Link>)}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
