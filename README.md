# KIIR website and staff CMS

Next.js (App Router) + Supabase implementation of the Kashmir Institute of
International Relations public website, built from the Claude Design
mockup `KIIR Site.dc.html`. Bilingual (English / Urdu), editorial-magazine
layout: homepage with a featured carousel and filterable latest feed,
per-program archives, article pages, and database-backed Activities/Events/Publications
archives.

Staff authentication, roles, programs, managed images/PDFs, editorial content,
four publication templates, website settings, announcements, a private contact inbox,
and localized search delivery are implemented. Open `/admin/login`, then
**Content**. Draft edits stay private until **Publish changes**. Public articles,
archives and homepage content read published Supabase snapshots.

See [authentication setup](docs/CMS-AUTH-SETUP.md),
[programs and media](docs/CMS-PROGRAMS-MEDIA.md), and
[articles and publication editing](docs/CMS-CONTENT-PUBLICATIONS.md), and
[settings, localization and release](docs/CMS-SETTINGS-SEO-RELEASE.md), and
[search visibility/domain migration](docs/SEO-DOMAIN-MIGRATION.md) for setup,
staff workflows, formatting support and verification. The
[implementation plan](docs/CMS-IMPLEMENTATION-PLAN.md) records the original scope.
Historical content import remains excluded by request. Older `../PROJECT-NOTES.md` describes the original build.

## Quick start

```bash
npm install
npm run dev
```

Open [the local website](http://localhost:3000). Use Node.js 24.x.
Copy `.env.local.example` to `.env.local` and supply the Supabase configuration
for CMS use. Server credentials and local account files must stay out of Git.

## Database setup

Apply the versioned migrations in order using the Supabase CLI against the
intended project. Follow the setup guides above for provider configuration and
first Admin provisioning. **Do not rerun the legacy seed against the configured
CMS project**: recovered content requires a reviewed import.

Public content/program queries use the configured database and report failures;
they do not replace empty live records or errors with demonstration articles.
Without configuration the original local design dataset is available for design
review only. Organization, contact, social and ticker settings use the CMS database.
Cleared optional contact/social fields stay blank throughout the public site.

## Verification

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
npm run test:content:integration
```

The integration command creates and removes disposable remote test records; it
requires the configured development Supabase project. See the stage guides for
broader authentication and media checks.

## Project structure

```
app/                      routes (App Router)
  layout.tsx               shared document/fonts, initial EN/UR document language
  (public)/layout.tsx      public chrome and server-fetched org/nav/footer data
  (auth)/admin/login/      staff login outside the protected CMS layout
  (cms)/admin/             protected editorial, settings, inbox, staff and help routes
  (public)/page.tsx        home
  programs/[slug]/         program archive (type filter + pagination via searchParams)
  articles/[slug]/         article detail
  activities/ events/ publications/  classification-scoped archives (mirrors program archive UI)
  about/ contact/ privacy/ terms/
  not-found.tsx

components/                all client components (bilingual text needs the
                            LanguageProvider context, which is client-only —
                            see the note in lib/i18n.ts)
  LanguageProvider.tsx      EN/UR context, URL navigation with cookie preference
  Site*.tsx, TopBar.tsx     shared chrome
  icons.tsx                 inline SVG — do NOT use Unicode glyphs (‹ › ▾ ✉ etc.)
                             for UI icons; they render blank in the loaded Google
                             Fonts subsets (see app/fonts.ts). Real bug, cost a
                             debugging pass — see git history / conversation.
  home/ programs/ articles/ archives/ about/ contact/   per-page components

lib/
  types.ts                  public presentation shapes
  queries.ts                 bounded public queries over published snapshots/catalog
  seed/data.ts                original design dataset
  supabase/                   public, staff-session and server-only service clients
  cms/                        editorial validation, permissions, media and settings
  actions.ts                  "use server" — contact form submission
  i18n.ts, format.ts          UI string dictionary, date formatting

supabase/
  migrations/2026*.sql              versioned CMS schema, RLS, guards and worker
  migrations/000*.sql, seed.sql      legacy design baseline; do not apply to CMS
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
  server-fetched props. The EN/UR selector navigates between English and `/ur`
  URLs. Initial HTML, metadata and document direction agree with the selected
  route. Filters and pagination retain the language and remain bookmarkable.

## Known gaps / deliberately deferred

- **Real content migration.** The seed data is realistic placeholder
  editorial content (same dataset as the design mockup), not the 100 real
  CMS records recovered from the old site — see `PROJECT-NOTES.md` §7 for
  why that needs a human pass first. The CMS plan includes schema changes
  for flexible classifications, publication formatting, and managed media.
- **Social links.** Footer icons are real SVG brand marks, but no
  verified KIIR account URLs exist in the recovered source material — see
  `PROJECT-NOTES.md` §5. Wire real handles via the `social` site_setting.
- **Publication formatting is implemented.** Validated editor JSON is rendered
  through an allowlisted shared renderer, with shared editor/public typography.
  Supported formatting is documented in the publication guide; arbitrary Word
  layout and automatic DOCX/PDF conversion are outside this editor.
- **Language routes and SEO are implemented.** `/ur` URLs, canonical/hreflang,
  structured data, sitemap and RSS expose published content only.
- **Release:** a verified Vercel preview is available at
  [the CMS preview](https://kiir-arimgxj4i-ar162387s-projects.vercel.app).
  The production website is [kiir-opal.vercel.app](https://kiir-opal.vercel.app);
  staff sign in at [/admin/login](https://kiir-opal.vercel.app/admin/login).
  Source releases are committed to `ar162387/kiir` on `main`.
