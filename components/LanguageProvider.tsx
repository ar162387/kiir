"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  // Keep the <html lang/dir> chrome attributes in sync — screen readers and
  // the browser's own UI (find-in-page, spellcheck) rely on these.
  useEffect(() => {
    document.documentElement.lang = lang === "ur" ? "ur" : "en";
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

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
