import {pageMetadata} from "@/lib/seo";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType } from "@/lib/queries";

export async function generateMetadata(){return pageMetadata('/events','Events','تقریبات','KIIR events, meetings and dialogues.','کے آئی آئی آر کی تقریبات، اجلاس اور مکالمے۔');}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getItemsByType("event", { category: sp.category, page, pageSize: 9 });

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
      categoryFilter={sp.category ?? "all"}
    />
  );
}
