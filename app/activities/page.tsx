import type { Metadata } from "next";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType, getPrograms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Activities",
  description: "Trainings, clinics, dialogues and fieldwork across KIIR's seven programs.",
};

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [programs, result] = await Promise.all([
    getPrograms(),
    getItemsByType("activity", { category: sp.category, page, pageSize: 9 }),
  ]);

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
      programs={programs}
      categoryFilter={sp.category ?? "all"}
    />
  );
}
