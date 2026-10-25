import {brandLogoUrl} from './branding';
import {activeAnnouncements,type Announcement} from "@/lib/cms/settings-types";
import { SEED_ABOUT, SEED_CONTACT, SEED_ITEMS, SEED_ORG, SEED_PROGRAMS, SEED_SOCIAL, SEED_TICKER } from "@/lib/seed/data";
import type { AboutSettings, ContactSettings, ContentItem, ContentType, OrgSettings, Program, SocialSettings } from "@/lib/types";
import { publicContent } from './cms/content-public';
import type {ContentDraft} from './cms/content-types';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/supabase/config';

const LEGACY_PROGRAM_MAP: Record<string, string> = {
  "political-development": "international-advocacy",
  "media-development": "training",
  gender: "human-rights",
  "capacity-building-idps": "training",
  "disaster-risk-reduction": "climate-action",
  "conflict-resolution": "international-advocacy",
  "human-rights": "human-rights",
};
const PUBLICATION_KIND_BY_SLUG: Record<string, string> = {
  "un-hrc-58-oral-statement": "opinion-articles",
  "women-peace-committees-baseline": "research-papers",
  "submission-cedaw-periodic-review": "research-papers",
  "quarterly-detention-monitor-q2": "newsletters",
  "oic-contact-group-briefing": "opinion-articles",
};

// ---------------------------------------------------------------------------
// Every function here has two code paths: a Supabase query (used when
// NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are set) and a read over the local
// seed array (used otherwise, so the app runs with zero setup). Both return
// the same shape. When wiring a real admin/CMS, only the Supabase path
// matters — the seed path exists purely for local dev / design review.
// ---------------------------------------------------------------------------

const getSettings=cache(async()=>{
 const c=getSupabaseConfig();if(!c)return null;
 const client=createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.from('site_settings').select('key,value').limit(5);
 if(error)throw Error('Website settings are temporarily unavailable.');
 return Object.fromEntries(data.map(row=>[row.key,row.value]));
});
async function setting<T>(key:string,fallback:T):Promise<T>{const settings=await getSettings();if(!settings)return fallback;if(!Object.hasOwn(settings,key))throw Error('Website settings need configuration.');return settings[key] as T;}
export async function getOrgSettings():Promise<OrgSettings>{const org=await setting('org',SEED_ORG);return {...org,logo_url:brandLogoUrl(org.logo_url)};}
export async function getContactSettings():Promise<ContactSettings>{return setting('contact',SEED_CONTACT);}
export async function getSocialSettings():Promise<SocialSettings>{return setting('social',SEED_SOCIAL);}
export async function getAboutSettings():Promise<AboutSettings>{return setting('about',SEED_ABOUT);}
export async function getTicker():Promise<Announcement[]>{return activeAnnouncements(await setting<Announcement[]>('ticker',SEED_TICKER.map((a,i)=>({id:String(i),is_active:true,segments:[{text:a.text,href:'/articles/'+a.slug}],segments_ur:a.text_ur?[{text:a.text_ur,href:'/articles/'+a.slug}]:[]}))));}

export const getPrograms = cache(async (): Promise<Program[]> => {
  const config=getSupabaseConfig();
  if(!config) return localPrograms();
  const sb=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await sb.from('programs').select('slug,name,name_ur,description,description_ur,long_description,long_description_ur,image_url,sort_order')
    .eq('is_active',true).order('sort_order').order('name').order('id');
  if(error) throw new Error('Programs are temporarily unavailable.');
  return data.map(p=>({...p,icon:null,long_description:p.long_description||p.description,
    long_description_ur:p.long_description_ur||(!p.long_description?p.description_ur:null)})) as Program[];
});

export async function getProgramAlias(slug:string):Promise<string|null> {
  const config=getSupabaseConfig();
  if(!config) return null;
  const sb=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await sb.from('program_redirects').select('programs(slug)').eq('old_slug',slug).maybeSingle();
  if(error) throw new Error('Program redirects are temporarily unavailable.');
  const program=data?.programs as unknown as {slug:string}|null;
  return program?.slug??null;
}

function localPrograms(): Program[] {
  const local = SEED_PROGRAMS
    .filter((program) => ["human-rights", "disaster-risk-reduction", "media-development", "political-development"].includes(program.slug))
    .map((program) => ({ ...program }));
  const overrides: Record<string, Pick<Program, "slug" | "name" | "name_ur" | "description" | "description_ur" | "sort_order">> = {
    "human-rights": { slug: "human-rights", name: "Human Rights", name_ur: "انسانی حقوق", description: "Monitoring, documentation and support for rights and dignity.", description_ur: "حقوق اور وقار کی نگرانی، دستاویز سازی اور معاونت۔", sort_order: 1 },
    "disaster-risk-reduction": { slug: "climate-action", name: "Climate Action", name_ur: "موسمیاتی اقدام", description: "Community-led climate resilience and preparedness.", description_ur: "کمیونٹی کی قیادت میں موسمیاتی لچک اور تیاری۔", sort_order: 2 },
    "media-development": { slug: "training", name: "Training", name_ur: "تربیت", description: "Practical learning for communities, journalists and civic leaders.", description_ur: "کمیونٹیز، صحافیوں اور شہری رہنماؤں کے لیے عملی تربیت۔", sort_order: 3 },
    "political-development": { slug: "international-advocacy", name: "International Advocacy", name_ur: "بین الاقوامی وکالت", description: "Evidence-led engagement with international institutions.", description_ur: "بین الاقوامی اداروں کے ساتھ شواہد پر مبنی رابطہ۔", sort_order: 4 },
  };
  return local.map((program) => ({ ...program, ...overrides[program.slug] })).sort((a, b) => a.sort_order - b.sort_order);
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const programs = await getPrograms();
  return programs.find((p) => p.slug === slug) ?? null;
}

function publicClient(){const c=getSupabaseConfig();return c?createClient(c.url,c.key,{auth:{persistSession:false,autoRefreshToken:false}}):null;}
type CatalogOptions={types?:ContentType[];category?:string;kind?:string;date?:string;page?:number;pageSize?:number;featured?:boolean;upcoming?:boolean};
async function catalog(opts:CatalogOptions={}){
 const sb=publicClient()!;const page=Math.max(1,Math.floor(opts.page??1));const pageSize=Math.max(1,Math.min(100,Math.floor(opts.pageSize??9)));
 let query=sb.from('content_catalog').select('*',{count:'exact'});
 if(opts.types){const conditions=opts.types.map(type=>type==='activity'?'is_activity.eq.true':type==='event'?'is_event.eq.true':type==='publication'||type==='news_publication'?'publication_kind.not.is.null':'and(is_activity.eq.false,is_event.eq.false,publication_kind.is.null)');query=query.or(conditions.join(','));}
 if(opts.category)query=query.contains('categories',[opts.category]);if(opts.kind)query=query.eq('publication_kind',opts.kind);
 if(opts.date&&/^\d{4}-\d{2}-\d{2}$/.test(opts.date)){const start=new Date(opts.date+'T00:00:00Z');if(!Number.isNaN(start.valueOf())){const end=new Date(start.valueOf()+86400000);query=query.gte('published_at',start.toISOString()).lt('published_at',end.toISOString());}}
 if(opts.upcoming)query=query.eq('is_event',true).eq('event_status','scheduled').gt('event_start',new Date().toISOString()).order('event_start');
 else if(opts.featured)query=query.order('is_featured',{ascending:false}).order('feature_rank');
 query=query.order('published_at',{ascending:false}).order('id');
 const{data,error,count}=await query.range((page-1)*pageSize,page*pageSize-1);
 if(error){
  if(error.code!=='PGRST103')throw Error('Published content is temporarily unavailable.');
  // A deleted/empty last page is not a service outage. Recover its bounded count
  // so route pages can return a real 404 for an out-of-range archive request.
  const{count:actualCount,error:countError}=await query.range(0,0);
  if(countError)throw Error('Published content is temporarily unavailable.');
  return {items:[],total:actualCount??0,page,pageCount:Math.max(1,Math.ceil((actualCount??0)/pageSize))};
 }
 const items=data.map(row=>publicContent({...row,excerpt:row.short_description,excerpt_ur:row.short_description_ur} as unknown as ContentDraft,row.slug,row.published_at,row.categories));
 return {items,total:count??0,page,pageCount:Math.max(1,Math.ceil((count??0)/pageSize))};
}
const getAllItems=cache(async ():Promise<ContentItem[]>=>SEED_ITEMS.map(item=>({...item,categories:item.categories.map(slug=>LEGACY_PROGRAM_MAP[slug]??slug)})));
function matchesType(item:ContentItem,type:ContentType){return type==='activity'?(item.is_activity??item.type==='activity'):type==='event'?(item.is_event??item.type==='event'):['publication','news_publication'].includes(type)?Boolean(item.publication_kind)||['publication','news_publication'].includes(item.type):item.type===type;}

export async function getFeaturedItems(limit = 5): Promise<ContentItem[]> {
  if(publicClient())return (await catalog({featured:true,pageSize:limit})).items;
  const items = await getAllItems();
  return [...items].sort((a,b)=>Number(b.is_featured)-Number(a.is_featured)||(a.is_featured&&b.is_featured?a.priority-b.priority:0)||b.item_date.localeCompare(a.item_date)||a.slug.localeCompare(b.slug)).slice(0,limit);
}

export async function getFeed(opts: { category?: string; limit?: number } = {}): Promise<{
  items: ContentItem[];
  total: number;
}> {
  if(publicClient())return catalog({category:opts.category,pageSize:opts.limit??100});
  const items = await getAllItems();
  const chronological = [...items].sort((a, b) => (a.item_date < b.item_date ? 1 : -1));
  const filtered = opts.category
    ? chronological.filter((i) => i.categories.includes(opts.category!))
    : chronological;
  return { items: filtered.slice(0, opts.limit ?? filtered.length), total: filtered.length };
}

export async function getUpcomingEvents(limit = 3): Promise<ContentItem[]> {
  if(publicClient())return (await catalog({upcoming:true,pageSize:limit})).items;
  const items = await getAllItems();
  const today = new Date();
  return items
    .filter((i) => matchesType(i,"event") && i.event_status!=="cancelled" && i.event_status!=="postponed" && new Date(i.event_start??i.item_date) > today)
    .sort((a, b) => ((a.event_start??a.item_date) > (b.event_start??b.item_date) ? 1 : -1))
    .slice(0, limit);
}

export async function getPublications(limit = 4): Promise<ContentItem[]> {
  if(publicClient())return (await catalog({types:["publication"],pageSize:limit})).items;
  const items = await getAllItems();
  return items
    .filter((i) => matchesType(i,"publication"))
    .sort((a, b) => (a.item_date < b.item_date ? 1 : -1))
    .slice(0, limit);
}

export async function getItemsByProgram(
  slug: string,
  opts: { type?: ContentType | "all"; page?: number; pageSize?: number } = {}
): Promise<{ items: ContentItem[]; total: number; page: number; pageCount: number }> {
  if(publicClient())return catalog({category:slug,types:opts.type&&opts.type!=="all"?[opts.type]:undefined,page:opts.page,pageSize:opts.pageSize});
  const items = await getAllItems();
  const tagged = items
    .filter((i) => i.categories.includes(slug))
    .sort((a, b) => (a.item_date < b.item_date ? 1 : -1));
  const filtered = !opts.type || opts.type === "all" ? tagged : tagged.filter((i) => matchesType(i,opts.type as ContentType));
  const pageSize = opts.pageSize ?? 9;
  const page = Math.max(1, opts.page ?? 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageCount };
}

export async function getItemsByType(
  type: ContentType | ContentType[],
  opts: { category?: string; kind?: string; date?: string; page?: number; pageSize?: number } = {}
): Promise<{ items: ContentItem[]; total: number; page: number; pageCount: number }> {
  if(publicClient())return catalog({types:Array.isArray(type)?type:[type],category:opts.category,kind:opts.kind,date:opts.date,page:opts.page,pageSize:opts.pageSize});
  const types = Array.isArray(type) ? type : [type];
  const items = await getAllItems();
  let filtered = items.filter((i) => types.some(type=>matchesType(i,type))).sort((a, b) => (a.item_date < b.item_date ? 1 : -1));
  if (opts.category) filtered = filtered.filter((i) => i.categories.includes(opts.category!));
  if (opts.kind) filtered = filtered.filter((i) => (i.publication_kind??PUBLICATION_KIND_BY_SLUG[i.slug]) === opts.kind);
  if (opts.date) filtered = filtered.filter((i) => i.item_date === opts.date);
  const pageSize = opts.pageSize ?? 9;
  const page = Math.max(1, opts.page ?? 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageCount };
}

export async function getProgramStats(
  slug: string
): Promise<{ total: number; activity: number; event: number; publication: number }> {
  if(publicClient()){const [total,activity,event,publication]=await Promise.all([catalog({category:slug,pageSize:1}),catalog({category:slug,types:['activity'],pageSize:1}),catalog({category:slug,types:['event'],pageSize:1}),catalog({category:slug,types:['publication'],pageSize:1})]);return {total:total.total,activity:activity.total,event:event.total,publication:publication.total};}
  const items = await getAllItems();
  const tagged = items.filter((i) => i.categories.includes(slug));
  return {
    total: tagged.length,
    activity: tagged.filter((i) => matchesType(i,"activity")).length,
    event: tagged.filter((i) => matchesType(i,"event")).length,
    publication: tagged.filter((i) => matchesType(i,"publication")).length,
  };
}

export const getItemBySlug=cache(async(slug:string):Promise<ContentItem|null>=>{
 const sb=publicClient();if(!sb)return (await getAllItems()).find(i=>i.slug===slug)??null;
 const{data,error}=await sb.from('content_live').select('id,slug,published_at,snapshot').eq('slug',slug).maybeSingle();
 if(error)throw Error('This article is temporarily unavailable.');if(!data)return null;
 const{data:listing,error:linkError}=await sb.from('content_catalog').select('categories').eq('id',data.id).single();if(linkError)throw Error('Content associations are unavailable.');return publicContent(data.snapshot as ContentDraft,data.slug,data.published_at,listing.categories,true);
});
export async function getContentAlias(slug:string):Promise<string|null>{const sb=publicClient();if(!sb)return null;const{data,error}=await sb.from('content_redirects').select('content_id').eq('old_slug',slug).maybeSingle();if(error)throw Error('Content redirects are unavailable.');if(!data)return null;const{data:live}=await sb.from('content_live').select('slug').eq('id',data.content_id).maybeSingle();return live?.slug??null;}

export async function getRelatedItems(item: ContentItem, limit = 3): Promise<ContentItem[]> {
  if(publicClient()){if(!item.categories.length)return [];const results=await Promise.all(item.categories.map(category=>catalog({category,pageSize:Math.min(limit+1,100)})));return [...new Map(results.flatMap(r=>r.items).filter(i=>i.slug!==item.slug).map(i=>[i.slug,i])).values()].sort((a,b)=>b.item_date.localeCompare(a.item_date)).slice(0,limit);}
  const items = await getAllItems();
  return items
    .filter((i) => i.slug !== item.slug && i.categories.some((c) => item.categories.includes(c)))
    .sort((a, b) => (a.item_date < b.item_date ? 1 : -1))
    .slice(0, limit);
}

export async function getProgramCounts(): Promise<Record<string, number>> {
  if(publicClient()){const programs=await getPrograms();return Object.fromEntries(await Promise.all(programs.map(async p=>[p.slug,(await catalog({category:p.slug,pageSize:1})).total])));}
  const items = await getAllItems();
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const cat of item.categories) counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}
