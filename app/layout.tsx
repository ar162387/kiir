import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { fontVariables } from "./fonts";
import { LanguageProvider } from "@/components/LanguageProvider";
import TopBar from "@/components/TopBar";
import SiteHeader from "@/components/SiteHeader";
import SiteNav from "@/components/SiteNav";
import NewsTicker from "@/components/NewsTicker";
import SiteFooter from "@/components/SiteFooter";
import { getContactSettings, getOrgSettings, getPrograms, getSocialSettings, getTicker } from "@/lib/queries";
import type { Lang } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    default: "KASHMIR INSTITUTE OF INTERNATIONAL RELATIONS (KIIR)",
    template: "%s · KIIR",
  },
  description:
    "An independent think tank documenting the Kashmir conflict, human rights and pathways to peace.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang: Lang = cookieStore.get("kiir-lang")?.value === "ur" ? "ur" : "en";

  const [org, programs, ticker, contact, social] = await Promise.all([
    getOrgSettings(),
    getPrograms(),
    getTicker(),
    getContactSettings(),
    getSocialSettings(),
  ]);

  return (
    <html lang={lang} dir="ltr" data-ur={lang === "ur" ? "1" : "0"} className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-cyan focus:px-4 focus:py-2 focus:font-mono focus:text-[12px] focus:uppercase focus:text-navy"
        >
          Skip to main content
        </a>
        <LanguageProvider initialLang={lang}>
          <TopBar contact={contact} social={social} />
          <SiteHeader org={org} />
          <div className="sticky top-0 z-40">
            <SiteNav programs={programs} />
            <NewsTicker items={ticker} />
          </div>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter org={org} programs={programs} contact={contact} social={social} />
        </LanguageProvider>
      </body>
    </html>
  );
}
