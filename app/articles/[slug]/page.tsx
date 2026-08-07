import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleClient from "@/components/articles/ArticleClient";
import { getItemBySlug, getPrograms, getRelatedItems } from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.short_description ?? undefined,
    openGraph: item.thumbnail_url ? { images: [item.thumbnail_url] } : undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item) notFound();

  const [allPrograms, related] = await Promise.all([getPrograms(), getRelatedItems(item, 3)]);
  const categories = allPrograms.filter((p) => item.categories.includes(p.slug));

  return <ArticleClient item={item} categories={categories} related={related} />;
}
