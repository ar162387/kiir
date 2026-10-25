import {getLocale} from "@/lib/locale";
import { LanguageProvider } from "@/components/LanguageProvider";
import TopBar from "@/components/TopBar";
import SiteHeader from "@/components/SiteHeader";
import SiteNav from "@/components/SiteNav";
import NewsTicker from "@/components/NewsTicker";
import SiteFooter from "@/components/SiteFooter";
import { getContactSettings, getOrgSettings, getPrograms, getSocialSettings, getTicker } from "@/lib/queries";
import type { Lang } from "@/lib/types";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const lang: Lang = await getLocale();

  const [org, programs, ticker, contact, social] = await Promise.all([
    getOrgSettings(),
    getPrograms(),
    getTicker(),
    getContactSettings(),
    getSocialSettings(),
  ]);

  return (
    <LanguageProvider key={lang} initialLang={lang} localized>
      <TopBar contact={contact} social={social} />
      <SiteHeader org={org} />
      <div className="sticky top-0 z-40">
        <SiteNav programs={programs} />
        <NewsTicker items={ticker} />
      </div>
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter org={org} programs={programs} contact={contact} social={social} />
    </LanguageProvider>
  );
}
