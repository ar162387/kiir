import {archivePage,paginatedPath,publicationSearch} from '@/lib/seo-content';
import {pageMetadata} from "@/lib/seo";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType } from "@/lib/queries";

export async function generateMetadata({searchParams}:{searchParams:Promise<{kind?:string;date?:string;page?:string}>}){const sp=await searchParams;const kind=sp.kind&&Object.hasOwn(publicationSearch,sp.kind)?sp.kind as keyof typeof publicationSearch:undefined;const info=kind?publicationSearch[kind]:null;const path=paginatedPath('/publications'+(kind?'?kind='+kind:''),sp.page);const metadata=await pageMetadata(path,(info?.en||'Publications')+(archivePage(sp.page)>1?' · Page '+archivePage(sp.page):''),info?.ur||'اشاعتیں',info?.description||'Opinion articles, research papers, short stories and newsletters from KIIR.','کے آئی آئی آر کی تحقیق، مضامین اور اشاعتیں۔');return {...metadata,...(sp.date?{robots:{index:false,follow:true}}:{})};}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; date?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = archivePage(sp.page);
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
