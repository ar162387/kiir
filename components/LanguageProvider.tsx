"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import {useRouter,usePathname} from "next/navigation";
import NavigationFeedback from "./NavigationFeedback";
import {localePath} from "@/lib/locale-path";
import type { Lang } from "@/lib/types";
import { t as translate, pick } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isUr: boolean;
  t: ReturnType<typeof translate>;
  pick: (en: string | null | undefined, ur: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const COOKIE_NAME = "kiir-lang";

function persistLang(lang: Lang) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LanguageProvider({
  initialLang,
  children,
  localized=false,
}: {
  initialLang: Lang;
  children: React.ReactNode;
  localized?: boolean;
}) {
  const [localLang, setLangState] = useState<Lang>(initialLang);
  const router=useRouter();const pathname=usePathname();const[pending,startTransition]=useTransition();
  // Shared layouts persist during client navigation, so derive locale from the live URL.
  const lang:Lang=localized?(pathname==='/ur'||pathname.startsWith('/ur/')?'ur':'en'):localLang;

  const setLang = useCallback((next: Lang) => {
    persistLang(next);
    if(localized){startTransition(()=>router.push(localePath(pathname,next)+window.location.search+window.location.hash));}
    else setLangState(next);
  }, [localized,router,pathname]);

  // Keep the <html lang/dir> chrome attributes in sync — screen readers and
  // the browser's own UI (find-in-page, spellcheck) rely on these.
  useEffect(() => {
    document.documentElement.lang = lang === "ur" ? "ur" : "en";
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.documentElement.setAttribute("data-ur", lang === "ur" ? "1" : "0");
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      isUr: lang === "ur",
      t: translate(lang),
      pick: (en, ur) => pick(en, ur, lang),
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}<NavigationFeedback pending={pending}/></LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
