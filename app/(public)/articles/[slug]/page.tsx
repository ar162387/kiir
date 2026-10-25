import {getLocale} from '@/lib/locale';
import {localePath} from '@/lib/locale-path';
import {articleMetadata,structuredArticle} from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import type { Metadata } from "next";
import { notFound,permanentRedirect } from "next/navigation";
import ArticleClient from "@/components/articles/ArticleClient";
import { getOrgSettings,getContactSettings,getContentAlias, getItemBySlug, getPrograms, getRelatedItems } from "@/lib/queries";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;const item=await getItemBySlug(slug);return item?articleMetadata(item):{robots:{index:false,follow:false}};}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang=await getLocale();
  const item = await getItemBySlug(slug);
  if (!item) {const alias=await getContentAlias(slug);if(alias)permanentRedirect(localePath(`/articles/${alias}`,lang));notFound();}

  const [allPrograms, related,contact,org] = await Promise.all([getPrograms(), getRelatedItems(item, 3),getContactSettings(),getOrgSettings()]);
  const categories = allPrograms.filter((p) => item.categories.includes(p.slug));

  return <><JsonLd value={structuredArticle(item,lang,{name:org.name,logo:org.logo_url})}/><ArticleClient contact={contact} item={item} categories={categories} related={related} /></>;
}
