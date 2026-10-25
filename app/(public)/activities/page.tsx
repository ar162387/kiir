import {archivePage,paginatedPath} from '@/lib/seo-content';
import {pageMetadata} from "@/lib/seo";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType } from "@/lib/queries";

export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string;category?:string}>}){const sp=await searchParams;const metadata=await pageMetadata(paginatedPath('/activities',sp.page),'Activities'+(archivePage(sp.page)>1?' · Page '+archivePage(sp.page):''),'سرگرمیاں','Recent activities and field updates from KIIR.');return {...metadata,...(sp.category?{robots:{index:false,follow:true}}:{})};}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = archivePage(sp.page);
  const result = await getItemsByType("activity", { category: sp.category, page, pageSize: 9 });

  return (
    <ArchiveClient
      basePath="/activities"
      titleEn="Activities"
      titleUr="سرگرمیاں"
      descriptionEn="Trainings, legal aid clinics, hazard mapping and fieldwork run directly with communities across Jammu & Kashmir and Azad Jammu & Kashmir."
      descriptionUr="جموں و کشمیر اور آزاد جموں و کشمیر میں کمیونٹیز کے ساتھ چلائی جانے والی تربیت، قانونی امداد اور فیلڈ ورک۔"
      items={result.items}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      categoryFilter={sp.category ?? "all"}
    />
  );
}
