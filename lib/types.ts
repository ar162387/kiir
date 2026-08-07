// Shared shapes for the public site. Mirrors supabase/migrations/0001_public_site.sql —
// keep the two in sync; this is the schema's TypeScript face, not a separate model.

export type ContentType = "activity" | "event" | "news_publication" | "publication" | "page";

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
  categories: string[]; // program slugs
}

export interface SocialSettings {
  x: string;
  facebook: string;
  linkedin: string;
  youtube: string;
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
  activity: { en: "Activity", ur: "سرگرمی" },
  event: { en: "Event", ur: "تقریب" },
  news_publication: { en: "News & Publications", ur: "خبریں و اشاعتیں" },
  publication: { en: "Publication", ur: "اشاعت" },
  page: { en: "Page", ur: "صفحہ" },
};
