import {pageMetadata} from "@/lib/seo";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType } from "@/lib/queries";

export async function generateMetadata(){return pageMetadata('/publications','Publications','اشاعتیں','Opinion articles, research papers, short stories and newsletters from KIIR.','کے آئی آئی آر کے مضامین، تحقیقی مقالے، کہانیاں اور نیوز لیٹر۔');}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; date?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getItemsByType(["news_publication", "publication"], { kind: sp.kind, date: sp.date, page, pageSize: 9 });

  return (
    <ArchiveClient
      basePath="/publications"
      titleEn="Publications"
      titleUr="اشاعتیں"
      descriptionEn="Opinion articles, research papers, short stories and newsletters from KIIR."
      descriptionUr="بیانات، بریفنگز اور تحقیق — بشمول اقوام متحدہ کے اداروں کو جمع کرائی گئی رپورٹس۔"
      items={result.items}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      categoryFilter="all"
      publicationKind={sp.kind ?? "all"}
      dateFilter={sp.date ?? ""}
      showPublicationFilters
    />
  );
}
