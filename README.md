# KIIR public site

Next.js (App Router) + Supabase implementation of the Kashmir Institute of
International Relations public website, built from the Claude Design
mockup `KIIR Site.dc.html`. Bilingual (English / Urdu), editorial-magazine
layout: homepage with a featured carousel and filterable latest feed,
per-program archives, article pages, and static Activities/Events/News
archives.

This is the **public side only** — no admin panel, no auth, no RBAC yet.
See `../PROJECT-NOTES.md` §10–11 for the full project history and what's
planned next.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. **No environment variables are required** —
without Supabase configured, every page reads from the local seed dataset
in `lib/seed/data.ts` (the same 7 programs / ~16 items used in the design
mockup), so the app is fully browsable out of the box.

## Wiring up Supabase

1. Create a Supabase project.
2. Run the migration and seed:
   ```bash
   # via the Supabase CLI, from this directory
   supabase db push                      # applies supabase/migrations/0001_public_site.sql
   supabase db execute -f supabase/seed.sql
   ```
   (Or paste both files into the Supabase SQL editor in order.)
3. Copy `.env.local.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Project Settings → API.
4. Restart `npm run dev`. `lib/queries.ts` automatically switches from the
   seed dataset to live Supabase queries once those two vars are set —
   nothing else to change.

The contact form (`app/contact/page.tsx` → `lib/actions.ts`) writes to a
`contact_messages` table and needs Supabase configured to actually submit;
without it, it shows a clear inline error instead of failing silently.

## Project structure

```
app/                      routes (App Router)
  layout.tsx               root layout — fetches org/nav/footer data server-side,
                            reads the `kiir-lang` cookie for initial EN/UR render
  page.tsx                 home
  programs/[slug]/         program archive (type filter + pagination via searchParams)
  articles/[slug]/         article detail
  activities/ events/ news/  type-scoped archives (mirrors program archive UI)
  about/ contact/ privacy/ terms/
  not-found.tsx

components/                all client components (bilingual text needs the
                            LanguageProvider context, which is client-only —
                            see the note in lib/i18n.ts)
  LanguageProvider.tsx      EN/UR context, cookie-persisted, no URL i18n routing
  Site*.tsx, TopBar.tsx     shared chrome
  icons.tsx                 inline SVG — do NOT use Unicode glyphs (‹ › ▾ ✉ etc.)
                             for UI icons; they render blank in the loaded Google
                             Fonts subsets (see app/fonts.ts). Real bug, cost a
                             debugging pass — see git history / conversation.
  home/ programs/ articles/ archives/ about/ contact/   per-page components

lib/
  types.ts                  shared shapes — mirrors the DB schema 1:1
  queries.ts                 data layer; every function has a Supabase path and a
                              seed-fallback path (see "Wiring up Supabase" above)
  seed/data.ts                local fallback content
  supabase/server.ts          anon-key client factory (public reads only)
  actions.ts                  "use server" — contact form submission
  i18n.ts, format.ts          UI string dictionary, date formatting

supabase/
  migrations/0001_public_site.sql   schema: categories, content_items,
                                     content_item_categories, media_assets,
                                     site_settings, contact_messages + RLS
  seed.sql                          same content as lib/seed/data.ts, in SQL
```

## Design fidelity notes

- Colors/type/spacing are lifted directly from the mockup's inline styles
  into Tailwind v4 `@theme` tokens in `app/globals.css` — see the comment
  block at the top of that file before adding new colors ad hoc.
- **`@layer base` matters.** Tailwind wraps all utilities in
  `@layer theme, base, components, utilities`. Any plain (unlayered) CSS
  rule — e.g. a bare `a { color }` reset — beats *every* utility class
  regardless of specificity, per the CSS cascade-layers spec. The base
  resets in `globals.css` are deliberately inside `@layer base` for this
  reason; moving them out will silently break every `text-*` utility on
  links/buttons again (this happened once already — see conversation
  history if you need the full diagnosis).
- Bilingual copy lives on the record itself (`title` / `title_ur`, etc.),
  not in a translation table — `lib/i18n.ts` only holds UI chrome strings.
  `useLanguage().pick(en, ur)` picks the right field and falls back to
  English if the Urdu field is empty.
- The homepage/program/article pages are Client Components fed by
  server-fetched props (not Server Components), specifically so the EN/UR
  toggle is instant with no re-fetch — matches the mockup's SPA-like
  toggle behavior. Program/archive pagination and type filters, by
  contrast, are real `<Link>`-driven URL params (server-rendered), which
  is a deliberate improvement over the mockup's ephemeral client state:
  filtered/paginated views are now bookmarkable and work without JS.

## Known gaps / deliberately deferred

- **Real content migration.** The seed data is realistic placeholder
  editorial content (same dataset as the design mockup), not the 100 real
  CMS records recovered from the old site — see `PROJECT-NOTES.md` §7 for
  why that needs a human pass first. Schema is already shaped to accept
  the real content with zero changes.
- **Social links.** Footer icons are real SVG brand marks, but no
  verified KIIR account URLs exist in the recovered source material — see
  `PROJECT-NOTES.md` §5. Wire real handles via the `social` site_setting.
- **Rich text sanitization.** `content_items.body` is rendered via
  `dangerouslySetInnerHTML` in `ArticleClient.tsx`. Fine for
  trusted seed/admin-authored content; add a sanitizer (e.g.
  `isomorphic-dompurify`) before any non-admin authoring path exists.
- **i18n routing.** Language is a client toggle + cookie, not `/en`/`/ur`
  URL segments — fine for this build, but means search engines only ever
  see one language's URL per page. Revisit if Urdu SEO matters.
- No RBAC/audit/users tables yet — intentionally out of scope for the
  public site. See `PROJECT-NOTES.md` for the plan.
