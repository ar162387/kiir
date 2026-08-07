import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProgramClient from "@/components/programs/ProgramClient";
import { getItemsByProgram, getProgramBySlug, getProgramStats, getPrograms } from "@/lib/queries";
import type { ContentType } from "@/lib/types";

type TypeFilter = ContentType | "all";
const VALID_TYPES: TypeFilter[] = ["all", "activity", "event", "news_publication"];

export async function generateStaticParams() {
  const programs = await getPrograms();
  return programs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) return {};
  return {
    title: program.name,
    description: program.description ?? undefined,
  };
}

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
  if (!program) notFound();

  const typeFilter: TypeFilter = VALID_TYPES.includes(sp.type as TypeFilter) ? (sp.type as TypeFilter) : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, stats] = await Promise.all([
    getItemsByProgram(slug, { type: typeFilter, page, pageSize: 9 }),
    getProgramStats(slug),
  ]);

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
