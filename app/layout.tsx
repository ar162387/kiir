import './editor-content.css';
import type { Metadata } from "next";
import {getLocale} from "@/lib/locale";
import "./globals.css";
import { fontVariables } from "./fonts";

export const metadata: Metadata = {
  title: { default: "KASHMIR INSTITUTE OF INTERNATIONAL RELATIONS (KIIR)", template: "%s · KIIR" },
  description: "An independent think tank documenting the Kashmir conflict, human rights and pathways to peace.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLocale();
  return (
    <html lang={lang} dir={lang==='ur'?'rtl':'ltr'} data-ur={lang === "ur" ? "1" : "0"} className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-cyan focus:px-4 focus:py-2 focus:text-navy">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
