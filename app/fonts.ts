import {
  Source_Serif_4,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Noto_Nastaliq_Urdu,
} from "next/font/google";

// Matches the Google Fonts stack pinned in the Claude Design mockup exactly
// (family names + weights). Keep these in sync with KIIR Site.dc.html.

export const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const nastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "600"],
  display: "swap",
});

export const fontVariables = [
  sourceSerif.variable,
  plexSans.variable,
  plexMono.variable,
  nastaliqUrdu.variable,
].join(" ");
