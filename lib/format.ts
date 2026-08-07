import type { Lang } from "@/lib/types";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_UR = [
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر",
];

/** "Jul 28, 2026" / Urdu-numeral-free month name + Latin day/year (matches the mockup). */
export function formatDate(iso: string, lang: Lang = "en"): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  const months = lang === "ur" ? MONTHS_UR : MONTHS_EN;
  return lang === "ur"
    ? `${d.getDate()} ${months[d.getMonth()]}، ${d.getFullYear()}`
    : `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatMonthDay(iso: string): { mon: string; day: number } {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return { mon: MONTHS_EN[d.getMonth()], day: d.getDate() };
}
