// Shared shapes for the public site. Mirrors supabase/migrations/0001_public_site.sql —
// keep the two in sync; this is the schema's TypeScript face, not a separate model.

export type ContentType = "article" | "activity" | "event" | "news_publication" | "publication" | "page";
export type PublicationKind = "opinion-articles" | "research-papers" | "short-stories" | "newsletters";

export type Lang = "en" | "ur";

export interface Program {
  slug: string;
  name: string;
  name_ur: string | null;
  description: string | null;
  description_ur: string | null;
  long_description: string | null;
  long_description_ur: string | null;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface ContentItem {
  slug: string;
  type: ContentType;
  title: string;
  title_ur: string | null;
  short_description: string | null;
  short_description_ur: string | null;
  body: string | null;
  body_ur: string | null;
  item_date: string; // ISO date
  priority: number;
  is_featured: boolean;
  thumbnail_url: string | null;
  publication_kind?: PublicationKind | null;
  is_activity?: boolean;
  is_event?: boolean;
  event_start?: string | null; event_end?: string | null; event_zone?: string; event_status?: string;
  event_venue?: string; event_url?: string; registration_url?: string;
  authors?: string; abstract?: string; keywords?: string; references?: string; issue?: string; epigraph?: string;
  document_url?: string; document_ur_url?: string; seo_title?: string; seo_description?: string;
  contents?: {id:string;text:string}[]; contents_ur?: {id:string;text:string}[];
  gallery?: {url:string;alt:string;caption:string;caption_ur:string}[];
  categories: string[]; // program slugs
}

export interface SocialSettings {
  x: string;
  facebook: string;
  instagram?: string;
  linkedin: string;
}

export interface OrgSettings {
  name: string;
  name_ur: string;
  tagline: string;
  tagline_ur: string;
  strapline: string;
  strapline_ur: string;
  blurb: string;
  blurb_ur: string;
  mission: string;
  mission_ur: string;
  logo_url: string;
  logo_asset_id?: string | null;
}

export interface ContactSettings {
  address: string;
  phone: string;
  email: string;
}

export interface AboutSettings {
  founded: string; // e.g. "1990"
  history_en: string;
  history_ur: string;
  principles: { title_en: string; title_ur: string; body_en: string; body_ur: string }[];
}

export interface TickerItem {
  text: string;
  text_ur: string;
  slug: string;
}

// The four type labels the public UI actually filters/displays by.
// "page" content (About, static pages) is excluded from feeds/archives.
export const PUBLIC_TYPES: ContentType[] = ["activity", "event", "news_publication", "publication"];

export const TYPE_LABEL: Record<ContentType, { en: string; ur: string }> = {
  article: { en: "Article", ur: "مضمون" },
  activity: { en: "Activity", ur: "سرگرمی" },
  event: { en: "Event", ur: "تقریب" },
  news_publication: { en: "Publications", ur: "خبریں و اشاعتیں" },
  publication: { en: "Publication", ur: "اشاعت" },
  page: { en: "Page", ur: "صفحہ" },
};
