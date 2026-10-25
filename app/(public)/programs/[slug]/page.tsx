import {archivePage,paginatedPath} from '@/lib/seo-content';
import {pageMetadata} from '@/lib/seo';
import {getLocale} from '@/lib/locale';
import {localePath} from '@/lib/locale-path';
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ProgramClient from "@/components/programs/ProgramClient";
import { getItemsByProgram, getProgramBySlug, getProgramStats, getPrograms, getProgramAlias } from "@/lib/queries";
import type { ContentType } from "@/lib/types";

type TypeFilter = ContentType | "all";
const VALID_TYPES: TypeFilter[] = ["all", "activity", "event", "news_publication"];

export async function generateStaticParams() {
  const programs = await getPrograms();
  return programs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{page?:string;type?:string}>}):Promise<Metadata>{const[{slug},sp]=await Promise.all([params,searchParams]);const p=await getProgramBySlug(slug);if(!p)return {robots:{index:false,follow:false}};const metadata=await pageMetadata(paginatedPath('/programs/'+slug,sp.page),p.name+(archivePage(sp.page)>1?' · Page '+archivePage(sp.page):''),p.name_ur||p.name,p.description||'',p.description_ur||p.description||'');return {...metadata,...(sp.type&&sp.type!=='all'?{robots:{index:false,follow:true}}:{})};}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const program = await getProgramBySlug(slug);
  if (!program) {
    const alias=await getProgramAlias(slug);
    if(alias) {
      const query=new URLSearchParams();
      if(sp.type)query.set('type',sp.type);if(sp.page)query.set('page',sp.page);
      permanentRedirect(`${localePath(`/programs/${alias}`,await getLocale())}${query.size?'?'+query:''}`);
    }
    notFound();
  }

  const typeFilter: TypeFilter = VALID_TYPES.includes(sp.type as TypeFilter) ? (sp.type as TypeFilter) : "all";
  const page = archivePage(sp.page);

  const [result, stats] = await Promise.all([
    getItemsByProgram(slug, { type: typeFilter, page, pageSize: 9 }),
    getProgramStats(slug),
  ]);
  if(page>result.pageCount)notFound();

  return (
    <ProgramClient
      program={program}
      items={result.items}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      typeFilter={typeFilter}
      stats={stats}
    />
  );
}
