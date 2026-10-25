import {pageMetadata} from "@/lib/seo";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType } from "@/lib/queries";

export async function generateMetadata(){return pageMetadata('/activities','Activities','سرگرمیاں','Recent activities and field updates from KIIR.','کے آئی آئی آر کی سرگرمیاں اور تازہ ترین معلومات۔');}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
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
