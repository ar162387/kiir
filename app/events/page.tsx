import type { Metadata } from "next";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType, getPrograms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Events",
  description: "Roundtables, symposiums and public convenings hosted or co-hosted by KIIR.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [programs, result] = await Promise.all([
    getPrograms(),
    getItemsByType("event", { category: sp.category, page, pageSize: 9 }),
  ]);

  return (
    <ArchiveClient
      basePath="/events"
      titleEn="Events"
      titleUr="تقریبات"
      descriptionEn="Roundtables, symposiums and Track-II dialogues — past and upcoming — convened or co-convened by KIIR."
      descriptionUr="کے آئی آئی آر کی جانب سے منعقد کردہ گول میز، سمپوزیم اور ٹریک ٹو مکالمے۔"
      items={result.items}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      programs={programs}
      categoryFilter={sp.category ?? "all"}
    />
  );
}
