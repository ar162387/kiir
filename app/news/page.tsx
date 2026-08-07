import type { Metadata } from "next";
import ArchiveClient from "@/components/archives/ArchiveClient";
import { getItemsByType, getPrograms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "News & Publications",
  description: "Statements, briefings, reports and research from KIIR.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [programs, result] = await Promise.all([
    getPrograms(),
    getItemsByType(["news_publication", "publication"], { category: sp.category, page, pageSize: 9 }),
  ]);

  return (
    <ArchiveClient
      basePath="/news"
      titleEn="News & Publications"
      titleUr="خبریں و اشاعتیں"
      descriptionEn="Statements, briefings and research — including submissions to UN treaty bodies and periodic monitoring reports."
      descriptionUr="بیانات، بریفنگز اور تحقیق — بشمول اقوام متحدہ کے اداروں کو جمع کرائی گئی رپورٹس۔"
      items={result.items}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      programs={programs}
      categoryFilter={sp.category ?? "all"}
    />
  );
}
