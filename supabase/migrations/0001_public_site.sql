-- KIIR public site — core content schema
--
-- Mirrors the content model documented in PROJECT-NOTES.md §6, derived from
-- the old AnywebCMS's flat record structure (every item — Page, Activity,
-- Event, News, Slider — shares one field set; only `type` distinguishes it).
-- The public Next.js app in this repo reads from this schema directly.
-- A future admin panel writes to the same tables — no schema changes
-- expected when real content replaces the seed data.
--
-- Run in the Supabase SQL editor, or: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- categories  (aka "Programs" in the public UI — Political Development,
-- Media Development, Gender, etc. Admin-manageable/expandable, per client
-- requirement — never hardcode this list in application code.)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  name_ur           text,
  description       text,          -- short card/teaser copy
  description_ur    text,
  long_description  text,          -- program-page hero copy
  long_description_ur text,
  icon              text,          -- single-glyph marker used as a lightweight motif
  image_url         text,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.categories is 'Programs / focus areas. Many-to-many with content_items.';

-- ---------------------------------------------------------------------------
-- content_items  (single flat table — type column distinguishes
-- Activity / Event / News & Publications / Publication / Page)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.content_type as enum ('activity', 'event', 'news_publication', 'publication', 'page');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.content_items (
  id                    uuid primary key default gen_random_uuid(),
  type                  public.content_type not null,
  slug                  text not null unique,
  title                 text not null,
  title_ur              text,
  short_description     text,
  short_description_ur  text,
  body                  text,                 -- rich text / HTML
  body_ur               text,
  meta_description      text,
  meta_keywords         text,
  item_date             date not null default current_date,   -- event/publish date shown on the item
  priority              int not null default 100,              -- manual sort order; lower sorts first
  is_published          boolean not null default true,
  is_featured           boolean not null default false,        -- drives the homepage Featured module
  thumbnail_url         text,
  hero_image_url        text,
  created_by            uuid references auth.users(id) on delete set null,
  updated_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists content_items_type_idx on public.content_items (type);
create index if not exists content_items_published_date_idx on public.content_items (is_published, item_date desc);
create index if not exists content_items_featured_idx on public.content_items (is_featured, priority) where is_featured;

comment on table public.content_items is 'Every Activity / Event / News & Publications / Publication / Page. One flat schema, matching the legacy CMS shape.';

-- ---------------------------------------------------------------------------
-- content_item_categories  (many-to-many join: an item can be tagged to
-- more than one program)
-- ---------------------------------------------------------------------------
create table if not exists public.content_item_categories (
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete cascade,
  primary key (content_item_id, category_id)
);

create index if not exists content_item_categories_category_idx on public.content_item_categories (category_id);

-- ---------------------------------------------------------------------------
-- media_assets  (Supabase Storage object references — replaces the old
-- content2021.kiir.org.pk media-server app entirely)
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,     -- path within the Supabase Storage bucket
  url           text not null,     -- resolved public URL, cached for fast reads
  alt_text      text,
  alt_text_ur   text,
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- site_settings  (single source of truth for everything that used to be
-- hardcoded template chrome: logo, favicon, contact info, social links,
-- footer text, ticker items, main menu, org name/tagline/blurb/strapline.
-- One JSONB row per logical setting — replaces the old "Theme elements" hack.)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on table public.site_settings is 'Editable site chrome: org identity, contact info, social links, ticker, nav. Keyed JSON blobs, one per setting.';

-- ---------------------------------------------------------------------------
-- contact_messages  (public contact form submissions — insert-only from the
-- anon key; reading/triaging them is an admin-side concern)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.categories;
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.content_items;
create trigger set_updated_at before update on public.content_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.site_settings;
create trigger set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — public (anon) read-only access to published content.
-- Writes are left to the service role / a future authenticated admin panel;
-- no anon insert/update/delete policies are defined here on purpose.
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.content_items enable row level security;
alter table public.content_item_categories enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "categories are publicly readable" on public.categories;
create policy "categories are publicly readable" on public.categories
  for select using (true);

drop policy if exists "published content is publicly readable" on public.content_items;
create policy "published content is publicly readable" on public.content_items
  for select using (is_published = true);

drop policy if exists "tag map is publicly readable" on public.content_item_categories;
create policy "tag map is publicly readable" on public.content_item_categories
  for select using (true);

drop policy if exists "media is publicly readable" on public.media_assets;
create policy "media is publicly readable" on public.media_assets
  for select using (true);

drop policy if exists "site settings are publicly readable" on public.site_settings;
create policy "site settings are publicly readable" on public.site_settings
  for select using (true);

-- Contact messages: anon may submit, may not read others' submissions back.
drop policy if exists "anyone can submit a contact message" on public.contact_messages;
create policy "anyone can submit a contact message" on public.contact_messages
  for insert with check (true);
