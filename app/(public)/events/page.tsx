import {notFound} from 'next/navigation';
import {archivePage,paginatedPath} from '@/lib/seo-content';
import {pageMetadata} from "@/lib/seo";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType } from "@/lib/queries";

export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string;category?:string}>}){const sp=await searchParams;const metadata=await pageMetadata(paginatedPath('/events',sp.page),'Events'+(archivePage(sp.page)>1?' · Page '+archivePage(sp.page):''),'تقریبات','KIIR events, meetings and dialogues.');return {...metadata,...(sp.category?{robots:{index:false,follow:true}}:{})};}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = archivePage(sp.page);
  const result = await getItemsByType("event", { category: sp.category, page, pageSize: 9 });
  if(page>result.pageCount)notFound();

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
