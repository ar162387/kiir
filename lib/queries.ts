import { getSupabase } from "@/lib/supabase/server";
import { SEED_ABOUT, SEED_CONTACT, SEED_ITEMS, SEED_ORG, SEED_PROGRAMS, SEED_SOCIAL, SEED_TICKER } from "@/lib/seed/data";
import type { AboutSettings, ContactSettings, ContentItem, ContentType, OrgSettings, Program, SocialSettings, TickerItem } from "@/lib/types";
import { PUBLIC_TYPES } from "@/lib/types";

// ---------------------------------------------------------------------------
// Every function here has two code paths: a Supabase query (used when
// NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set) and a read over the local
// seed array (used otherwise, so the app runs with zero setup). Both return
// the same shape. When wiring a real admin/CMS, only the Supabase path
// matters — the seed path exists purely for local dev / design review.
// ---------------------------------------------------------------------------

type RawItemRow = {
  slug: string;
  type: ContentType;
  title: string;
  title_ur: string | null;
  short_description: string | null;
  short_description_ur: string | null;
  body: string | null;
  body_ur: string | null;
  item_date: string;
  priority: number;
  is_featured: boolean;
  thumbnail_url: string | null;
  content_item_categories: { categories: { slug: string } | null }[] | null;
};

function mapRow(row: RawItemRow): ContentItem {
  return {
    slug: row.slug,
    type: row.type,
    title: row.title,
    title_ur: row.title_ur,
    short_description: row.short_description,
    short_description_ur: row.short_description_ur,
    body: row.body,
    body_ur: row.body_ur,
    item_date: row.item_date,
    priority: row.priority,
    is_featured: row.is_featured,
    thumbnail_url: row.thumbnail_url,
    categories: (row.content_item_categories ?? [])
      .map((c) => c.categories?.slug)
      .filter((s): s is string => Boolean(s)),
  };
}

const ITEM_SELECT =
  "slug,type,title,title_ur,short_description,short_description_ur,body,body_ur,item_date,priority,is_featured,thumbnail_url,content_item_categories(categories(slug))";

export async function getOrgSettings(): Promise<OrgSettings> {
  const sb = getSupabase();
  if (!sb) return SEED_ORG;
  const { data } = await sb.from("site_settings").select("value").eq("key", "org").maybeSingle();
  return (data?.value as OrgSettings) ?? SEED_ORG;
}

export async function getContactSettings(): Promise<ContactSettings> {
  const sb = getSupabase();
  if (!sb) return SEED_CONTACT;
  const { data } = await sb.from("site_settings").select("value").eq("key", "contact").maybeSingle();
  return (data?.value as ContactSettings) ?? SEED_CONTACT;
}

export async function getSocialSettings(): Promise<SocialSettings> {
  const sb = getSupabase();
  if (!sb) return SEED_SOCIAL;
  const { data } = await sb.from("site_settings").select("value").eq("key", "social").maybeSingle();
  return (data?.value as SocialSettings) ?? SEED_SOCIAL;
}

export async function getAboutSettings(): Promise<AboutSettings> {
  const sb = getSupabase();
  if (!sb) return SEED_ABOUT;
  const { data } = await sb.from("site_settings").select("value").eq("key", "about").maybeSingle();
  return (data?.value as AboutSettings) ?? SEED_ABOUT;
}

export async function getTicker(): Promise<TickerItem[]> {
  const sb = getSupabase();
  if (!sb) return SEED_TICKER;
  const { data } = await sb.from("site_settings").select("value").eq("key", "ticker").maybeSingle();
  return (data?.value as TickerItem[]) ?? SEED_TICKER;
}

export async function getPrograms(): Promise<Program[]> {
  const sb = getSupabase();
  if (!sb) return [...SEED_PROGRAMS].sort((a, b) => a.sort_order - b.sort_order);
  const { data, error } = await sb.from("categories").select("*").order("sort_order", { ascending: true });
  if (error || !data) return [...SEED_PROGRAMS].sort((a, b) => a.sort_order - b.sort_order);
  return data as Program[];
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const programs = await getPrograms();
  return programs.find((p) => p.slug === slug) ?? null;
}

async function getAllItems(): Promise<ContentItem[]> {
  const sb = getSupabase();
  if (!sb) return SEED_ITEMS;
  const { data, error } = await sb
    .from("content_items")
    .select(ITEM_SELECT)
    .in("type", PUBLIC_TYPES)
    .eq("is_published", true);
  if (error || !data) return SEED_ITEMS;
  return (data as unknown as RawItemRow[]).map(mapRow);
}

export async function getFeaturedItems(limit = 5): Promise<ContentItem[]> {
  const items = await getAllItems();
  return items
    .filter((i) => i.is_featured)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

export async function getFeed(opts: { category?: string; limit?: number } = {}): Promise<{
  items: ContentItem[];
  total: number;
}> {
  const items = await getAllItems();
  const chronological = [...items].sort((a, b) => (a.item_date < b.item_date ? 1 : -1));
  const filtered = opts.category
    ? chronological.filter((i) => i.categories.includes(opts.category!))
    : chronological;
  return { items: filtered.slice(0, opts.limit ?? filtered.length), total: filtered.length };
}

export async function getUpcomingEvents(limit = 3): Promise<ContentItem[]> {
  const items = await getAllItems();
  const today = new Date();
  return items
    .filter((i) => i.type === "event" && new Date(i.item_date) > today)
    .sort((a, b) => (a.item_date > b.item_date ? 1 : -1))
    .slice(0, limit);
}

export async function getPublications(limit = 4): Promise<ContentItem[]> {
  const items = await getAllItems();
  return items
    .filter((i) => i.type === "publication" || i.type === "news_publication")
    .sort((a, b) => (a.item_date < b.item_date ? 1 : -1))
    .slice(0, limit);
}

export async function getItemsByProgram(
  slug: string,
  opts: { type?: ContentType | "all"; page?: number; pageSize?: number } = {}
): Promise<{ items: ContentItem[]; total: number; page: number; pageCount: number }> {
  const items = await getAllItems();
  const tagged = items
    .filter((i) => i.categories.includes(slug))
    .sort((a, b) => (a.item_date < b.item_date ? 1 : -1));
  const filtered = !opts.type || opts.type === "all" ? tagged : tagged.filter((i) => i.type === opts.type);
  const pageSize = opts.pageSize ?? 9;
  const page = Math.max(1, opts.page ?? 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageCount };
}

export async function getItemsByType(
  type: ContentType | ContentType[],
  opts: { category?: string; page?: number; pageSize?: number } = {}
): Promise<{ items: ContentItem[]; total: number; page: number; pageCount: number }> {
  const types = Array.isArray(type) ? type : [type];
  const items = await getAllItems();
  let filtered = items.filter((i) => types.includes(i.type)).sort((a, b) => (a.item_date < b.item_date ? 1 : -1));
  if (opts.category) filtered = filtered.filter((i) => i.categories.includes(opts.category!));
  const pageSize = opts.pageSize ?? 9;
  const page = Math.max(1, opts.page ?? 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageCount };
}

export async function getProgramStats(
  slug: string
): Promise<{ total: number; activity: number; event: number; publication: number }> {
  const items = await getAllItems();
  const tagged = items.filter((i) => i.categories.includes(slug));
  return {
    total: tagged.length,
    activity: tagged.filter((i) => i.type === "activity").length,
    event: tagged.filter((i) => i.type === "event").length,
    publication: tagged.filter((i) => i.type === "publication" || i.type === "news_publication").length,
  };
}

export async function getItemBySlug(slug: string): Promise<ContentItem | null> {
  const items = await getAllItems();
  return items.find((i) => i.slug === slug) ?? null;
}

export async function getRelatedItems(item: ContentItem, limit = 3): Promise<ContentItem[]> {
  const items = await getAllItems();
  return items
    .filter((i) => i.slug !== item.slug && i.categories.some((c) => item.categories.includes(c)))
    .sort((a, b) => (a.item_date < b.item_date ? 1 : -1))
    .slice(0, limit);
}

export async function getProgramCounts(): Promise<Record<string, number>> {
  const items = await getAllItems();
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const cat of item.categories) counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}
