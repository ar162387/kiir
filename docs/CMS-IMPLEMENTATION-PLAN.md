# KIIR custom CMS implementation plan

Prepared: 25 October 2026 · Original planning record. Implementation is now delivered
through the CMS stages documented in [the release guide](CMS-SETTINGS-SEO-RELEASE.md).
Historical import remains excluded by request.

## 1. Recommended direction

Extend the existing Next.js website with a tailored `/admin` CMS in the same application. Use Supabase Auth for staff sign-in, Postgres for content and permissions, Cloudinary for media, and the existing Vercel deployment for the application. Keep the editorial layout, navigation patterns, featured carousel, upcoming-events column, archive cards, program pages, and English/Urdu controls.

The central change is a **single content record with independent classifications**. A record may belong to zero or more programs, be an activity, have event details, and belong to one publication category, in any combination. It has one canonical article URL and appears in every applicable listing without being copied.

Keep the editing experience small: English content, optional Urdu, media, “Where should this appear?”, and publishing controls. Publication-specific fields appear only when relevant. Admins manage the system; Content Managers manage editorial content within the permission matrix below.

These requirements supersede older decisions in `PROJECT-NOTES.md`: Cloudinary replaces the proposed Supabase Storage image library; four current programs replace the seven legacy programs; independent classifications replace the exclusive content type; publication templates require schema changes despite the earlier assumption that none would be necessary.

This document proposes implementation. No database migrations, account changes, uploads, deletions, or deployments were performed during planning.

## 2. Evidence reviewed and present limitations

### Current application

Reviewed the deployed homepage and Publications archive at [the current Vercel site](https://kiir-opal.vercel.app/), including accessible page structure, navigation, headings, filters, item labels, and links. Reviewed the source under `web/`, especially:

- `package.json`, `package-lock.json`, `README.md`, and `next.config.ts`.
- `app/layout.tsx`, homepage, article/program/archive routes, and the stylesheet/font configuration.
- `lib/types.ts`, `lib/queries.ts`, the seed dataset, public Supabase client, and contact action.
- Homepage, article, archive, ticker, language, header, footer, image, and contact components.
- The three existing migration files and SQL seed.

The manifest and lockfile resolve Next.js 16.3.0, React 19.2.8, Supabase JS 2.112.2, and `@supabase/ssr` 0.12.4. These are inspected project versions, not a claim about the latest available versions. Use the installed version's API contracts during implementation and pin new dependencies.

The browser exposed the live content and navigation successfully; screenshot capture failed, so this review does not claim a completed visual screenshot comparison. The deployed website's behavior agrees with the inspected source in the areas reviewed.

### Predecessor and migration material

Reviewed `PROJECT-NOTES.md`, recovered legacy C# retrieval patterns, `scraper/output-anywebcms/content-full.json`, `scraper/output/content-deduped.json`, and structural-page exports. Independently counted:

| Recovered material | Verified observation |
|---|---|
| CMS export | 100 records: 58 Activities, 24 Pages, 7 Events, 5 News & Publications, 2 Email Templates, 2 Theme elements, 1 Location, 1 Slider |
| Public export | 101 deduplicated records, with original URLs and alternate paths |
| Structural pages | 23 exported pages |
| Full local media library | 1,103 files |
| Publication evidence | Two substantive opinion-style texts with an author heading; three other records named BLOGS, News, and Reports have empty bodies |
| Urdu bodies in CMS export | No nonempty `otherDescription` values in the inspected 100 records |

The predecessor used a shared flat editor, publication/type labels, and category checkboxes. Earlier extraction notes report that content-type definitions contained labels and colors rather than separate schemas. The records support retaining a shared editor; they do **not** establish pre-existing research-paper, short-story, or newsletter templates. Those templates must be deliberately designed for this upgrade.

The old site served content as HTML and allowed one underlying item to appear under multiple category-prefixed paths. Preserve this reuse, improve canonical URLs, and redirect the old paths.

**Migration evidence needs reconciliation.** Earlier notes mention 33 unmatched CMS records, but a fresh exact comparison cannot reproduce that number: CMS IDs and public IDs are different namespaces, exact exported slugs do not match, and only 54 CMS records match a public title after basic normalization. Do not join the exports by ID or treat “33” as a verified deletion/import list. Build a reviewed crosswalk using titles, body excerpts, dates, media, and path evidence. The two exports can complement each other without assuming either is a complete one-to-one representation.

Direct retrieval of `kiir.org.pk` timed out during this review. Predecessor findings therefore rely on the recovered source and exports, rather than a new live admin audit. The database's applied migrations, Auth configuration, Cloudinary settings/usage, and Vercel environment were not audited remotely; credentials existing locally do not prove those services are configured.

## 3. Existing gaps that implementation must fix

| Current behavior | Required change |
|---|---|
| `content_type` is an exclusive enum; no ordinary `article` type | Replace classification logic with independent activity/event/publication fields |
| `ACTIVE_PROGRAMS` filters a fixed list; `LEGACY_PROGRAM_MAP` rewrites records at read time | Persist the chosen relationships once; query all active programs dynamically |
| Four programs are derived from older seed records | Seed the four current program records explicitly and idempotently |
| Publication category is inferred from five hardcoded slugs | Store category in the database; query it directly |
| `/news` heading says Publications, but metadata and content badges still say News & Publications | Rename all labels and metadata; introduce `/publications` with an old-URL redirect |
| Every query starts by loading all published bodies and filtering in JavaScript | Use database filtering, projections, limits, ordering, pagination, and aggregation |
| Homepage independently calls several functions that each load the complete content set | Share request-level reads and use bounded section queries |
| Supabase errors silently return demonstration content | Restrict seed mode to explicit local development; show controlled production failures |
| One `item_date` serves publication and event dates | Separate publication timestamp from event start/end and time zone |
| Featured query returns only explicitly marked items | Add recent-content fallback and deterministic ordering |
| Ticker links an entire announcement to an article slug | Support inline links to validated internal or external destinations |
| Header/footer render social icons without URLs | Hide absent fields and their containing groups consistently |
| Contact strings remain hardcoded in article support cards and error text | Use the same optional CMS settings everywhere |
| HTML is rendered without a sanitizer | Validate editor documents and sanitize rendered/imported HTML server-side |
| Language uses a cookie and large client page components | Resolve language on the server and render correct initial content and metadata |
| English fallback can receive Urdu typography/direction simply because Urdu is selected | Track the actual selected field/block language and direction |
| Media table assumes Supabase Storage and stores no usage relationships | Store Cloudinary identity, ownership, dimensions, and explicit asset references |
| Root layout wraps every route in public chrome | Split public and admin layouts before adding `/admin` |

The supplied environment names also differ from the current loader. The loader expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the local environment instead has `SUPABASE_PROJECT_URL`, `SUPBASE_PUBLISHABLE_KEY` (spelled without the second “A”), and `SUPABASE_SECRET_KEY`, plus database and Cloudinary credentials. Values were not printed. Normalize names and validate required configuration before enabling database mode. The current loader will otherwise keep returning seed data.

## 4. Application and rendering architecture

Use one repository and one Next.js application. A separate backend server or generic CMS product is unnecessary for this workload.

```text
Public visitor
  → Next.js public Server Components
  → bounded, read-only Supabase queries governed by RLS
  → server-rendered content and metadata
  → Cloudinary CDN images/documents

Staff member
  → custom /admin login and editor
  → authenticated Server Actions / narrow Route Handlers
  → verified Supabase session + current role check
  → transactional Postgres writes + audit + durable cleanup jobs

Staff browser → authenticated upload-signature endpoint → Cloudinary upload
             → verified upload finalization → media registry

Supabase Cron → authenticated Edge Function → media cleanup / retry processing
```

Public pages receive render-ready, localized records. Keep article bodies, archive markup, program descriptions, footer, and metadata on the server where practical. Use client components for carousel controls, ticker pause controls, menus, sharing, and editor interactions. Existing Client Components can already produce initial server HTML; this is a refinement of boundaries and data delivery, not a claim that the present site is entirely client-rendered. [Next.js server/client component documentation](https://nextjs.org/docs/app/getting-started/server-and-client-components)

Proposed route organization:

```text
app/layout.tsx                       minimal shared document shell
app/(public)/layout.tsx              public header, nav, ticker, footer
app/(public)/page.tsx
app/(public)/articles/[slug]/page.tsx
app/(public)/programs/[slug]/page.tsx
app/(public)/activities/page.tsx
app/(public)/events/page.tsx
app/(public)/publications/page.tsx
app/(public)/ur/...                  Urdu equivalents using shared page renderers
app/(auth)/admin/login/page.tsx
app/(cms)/admin/layout.tsx           authenticated staff shell
app/(cms)/admin/content/...
app/(cms)/admin/programs/...
app/(cms)/admin/announcements/...
app/(cms)/admin/media/...
app/(cms)/admin/settings/...
app/(cms)/admin/users/...
app/(cms)/admin/audit/...
app/api/media/sign/route.ts
app/api/media/finalize/route.ts
app/api/revalidate/route.ts          authenticated job callback only
proxy.ts                            staff session refresh / route screening
```

Keep login outside the protected admin layout to avoid redirect loops. Route groups do not change public URLs. Share implementations between languages instead of copying every component.

Start with request-time SSR for public content, satisfying the stated rendering requirement. Deduplicate repeated reads within a request; apply bounded shared data caching only to nonpersonal public data. Do not require Cache Components or full-route ISR as a prerequisite. Consider broader caching later after measuring actual usage and agreeing freshness behavior.

## 5. Authentication and permissions

### Login without email confirmation

Build a KIIR-branded email/password screen backed by Supabase `signInWithPassword`. “Custom login” means a custom interface; Supabase continues to handle password storage and token issuance.

- Disable public signup. Only an Admin provisions staff accounts.
- Disable the email provider's **Confirm Email** requirement. No magic link, OTP, confirmation email, or email check is required for routine sign-in. Supabase explicitly supports this configuration. [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration)
- Create provisioned users server-side with confirmed email status. `auth.admin.createUser` supports `email_confirm: true`; keep that API behind Admin authorization. [Admin user creation](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- Issue a temporary password through a separately agreed channel and require a password change on first use. No automated email delivery is assumed.
- Default recovery to an Admin-assisted reset because outbound email is not part of the agreed workflow. Protect the first/last Admin recovery procedure with a documented owner-run bootstrap process. Optional email recovery can be added later without changing normal sign-in.
- Handle invalid login, expiry, logout, disabled accounts, and refresh failures with clear messages and rate limits.

Use request-scoped cookie clients from `@supabase/ssr`. Verify server identities using `getClaims()` or `getUser()` as appropriate; never authorize based on `getSession()` alone. Keep staff/preview responses private and uncached. Do not cache a response that refreshes a session cookie. [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)

### Proposed initial permission matrix

The user specified that Content Managers have fewer permissions but did not define the exact boundary. This is the recommended default, to confirm during implementation kickoff.

| Capability | Admin | Content Manager |
|---|---|---|
| Create/edit content, optional Urdu, and media | Yes | Yes, across editorial records |
| Publish/unpublish content and mark featured | Yes | Yes |
| Create/edit/reorder programs | Yes | Yes |
| Delete a program and detach its relationships | Yes | No |
| Manage ticker announcements | Yes | Yes |
| Archive content; remove images from content | Yes | Yes |
| Permanently delete content or unused media | Yes | No |
| Update public contact/social details | Yes | Yes |
| Change branding/global organization settings | Yes | No |
| Create users, change roles, disable users | Yes | No |
| View organization-wide audit and cleanup controls | Yes | No |
| View contact messages | Yes | No, unless explicitly granted |

Content Managers still trigger automatic cleanup of images they replace/remove when those images are no longer referenced. They cannot bypass reference checks or delete another record's media manually. If editorial approval is desired, change only `content.publish` to Admin-only; do not introduce an approval workflow without a client need.

Use two fixed roles and named permissions initially. A generic role-builder UI is unnecessary. Store current staff membership, role, and enabled state in a protected table. Permission assignments cannot be updated through ordinary profile editing. Authenticate and authorize every Server Action, upload signer, finalization endpoint, preview, RPC, and user-management operation; hiding buttons is only UI behavior.

RLS remains the enforcement boundary for ordinary database operations. Check current membership for writes so role removal takes effect without waiting for stale JWT claims. Do not use user-editable `user_metadata` as an authorization source. Supabase documents an RBAC model using protected roles/permissions and claims; claims may be used for display or as an optimization, while current database membership controls sensitive actions. [Supabase RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)

Use the staff session for routine content writes. Reserve the secret/service client for tightly bounded tasks such as Auth administration and verified background cleanup; it bypasses RLS and requires an explicit authorization boundary. Prevent accidental removal/demotion of the last enabled Admin.

## 6. Content model and database design

### One article, multiple placements

Treat an article as the base editorial record. Its classification fields are independent:

```text
programs: [] or one/multiple existing program IDs
is_activity: true/false
is_event: true/false
publication_kind: null | opinion-articles | research-papers |
                         short-stories | newsletters
is_featured: true/false
```

Do not persist a redundant `is_publication` boolean: `publication_kind IS NOT NULL` is the database definition. The editor can show a Publication switch that reveals the category selector. Selecting no program is always valid, including for activities, events, and publications.

Example: “Community climate workshop” can be tagged Climate Action, Activity, and Event with dates; a research paper about it can use those same flags plus Research Papers if the editor wants a single combined record. All matching archives link to the same `/articles/[slug]`.

### Draft safety

Saving edits to a published record must not change the live article until **Publish changes** is selected. Keep a stable content identity plus a current draft and published snapshot. A compact version table is justified for this behavior; a historical version-browser feature is not required.

The public query follows only the published snapshot. Draft program associations, dates, translated text, and assets remain staff-only. Publishing switches snapshots atomically. Archive/unpublish removes public visibility atomically. Retire superseded snapshots once no longer needed; the audit keeps a change summary, not a permanent media-retaining undo history.

### Proposed tables

Table names are target design names; implement them through forward migrations and temporary compatibility adapters.

| Entity | Main fields and purpose |
|---|---|
| `programs` | UUID, unique slug, English name/description, optional Urdu equivalents and longer introduction, image asset ID, order, active state, audit timestamps |
| `content_items` | UUID, stable unique slug, published/draft snapshot pointers, publication state, first/last publication timestamps, creator/updater, optimistic-lock version |
| `content_versions` | Parent content UUID; EN/UR title, excerpt, validated editor document and rendered body; independent classifications; event fields; publication details; SEO fields; featured flag/order; translation readiness |
| `content_version_programs` | Version UUID + program UUID; unique pair; no relationship required |
| `media_assets` | UUID, immutable Cloudinary asset ID, public ID, resource/delivery types, version, format, dimensions, bytes, filename, uploader, lifecycle state, creation/finalization times |
| `media_references` | Asset UUID, owner entity/version, placement, order, optional localized caption/alt text and crop; covers cover, body, gallery, document, program image, logo, and social image |
| `announcements` | UUID, validated inline EN/UR document, enabled flag, sort order, optional start/end visibility, updater |
| `site_settings` | Validated public organization, branding, about, contact, and social settings; never credentials |
| `cms_memberships` | Auth user UUID, fixed role, enabled flag, display name; protected from self-escalation |
| `audit_logs` | Actor, action, entity, changed field names/safe summary, timestamp, request ID; append-only for application users |
| `media_jobs` | Asset UUID, job kind, deduplication key, state, attempts, next attempt, lease, last safe error, completion time |
| `legacy_content_map` | Source namespace + source ID + original path → new content/program UUID; review/import status |
| `redirects` | Unique original path → canonical destination or explicitly reviewed retired state |
| `contact_messages` | Retain existing contact inbox records with restricted reading and bounded submission controls |

Give `media_references` real foreign keys for supported owners, for example nullable version/program/setting references with a constraint requiring exactly one owner. Avoid an unchecked polymorphic `entity_type + entity_id` pair. Enforce unique placement/order rules and allow the same asset to have several valid references. Snapshot pointers must reference versions belonging to the same content item; use composite keys/constraints or equivalent enforced checks.

Use `auth.users` as the identity source; do not create another password table. Keep memberships, jobs, import administration, and audit internals outside exposed schemas where practical. Exposed tables require both explicit grants and RLS. Any public view must use invoker security and respect publication visibility.

Store recurring publication metadata as typed fields or a validated, versioned `publication_details` object: authors, abstract, keywords, issue/volume, reference blocks, reading-style options, and document asset IDs. Core filter/sort/classification fields belong in typed columns, not arbitrary metadata tags.

### Required integrity rules

- Slugs are unique and remain stable unless deliberately changed; publish a redirect when changing an existing URL.
- Event start is required when an event is published; end is optional and cannot precede start. Drafts can remain incomplete.
- Publication category must be one of the four allowed values. A published publication requires readable body content or a valid document plus meaningful summary.
- All relationships use UUIDs; titles and slugs are display/navigation values, not foreign keys.
- EN is the required default language. Urdu fields are nullable; blank/whitespace-only input normalizes to null.
- Content, classification, program links, media references, published pointers, audit entries, and cleanup jobs are committed together through a transaction-backed mutation boundary.
- Database policies/triggers enforce permissions and invariants even if an authenticated caller bypasses the UI. UPDATE policies need matching SELECT permission and both old-row and new-row checks.
- Reject stale writes using a version or `updated_at` precondition; explain the conflict and allow reload/reconciliation.
- Media attachment must check asset readiness and ownership/allowed reuse, and must reject assets already leased for deletion.

Indexes should cover published lookup by slug; activity/publication filters and descending publication date; upcoming event start; featured order; reverse program joins; media references by asset; jobs by state/next attempt; and audit date/entity. Query actual execution plans after realistic import volumes.

## 7. Program management and deletion behavior

Seed exactly Human Rights, Climate Action, Training, and International Advocacy as ordinary database records. Carry over their current names, descriptions, Urdu seed text, order, and selected images after validation. Upsert by stable seed identity/slug so rerunning a seed does not duplicate records. Seed execution is explicit; it must never recreate a program that staff deliberately deleted during normal operation.

Program editor: name, automatically suggested editable slug, image picker/upload, secondary description, optional longer introduction, optional Urdu tab, visibility, and display order. A new active program automatically appears in navigation, footer, homepage program cards, article selectors, and archives without a source-code update.

Remove `ACTIVE_PROGRAMS`, runtime legacy remapping, and fixed “Four areas of sustained work” copy. Replace the latter with editable copy that remains true when the program count changes.

Deleting a program must preserve articles. Show the linked-content count and let an Admin detach those links or reassign them in the same transaction. Retire its route or redirect it to a relevant replacement. Delete its image from Cloudinary only if no other active owner references that image. Deactivation is a less disruptive available action, but permanent deletion remains supported as requested.

The existing `0002` migration deletes three categories with cascading tag links. Do not rerun that migration blindly against real legacy data. First preserve the legacy associations and map them to current programs through a reviewed crosswalk; Gender → Human Rights, for example, may be a starting suggestion, not an unquestionable editorial truth.

## 8. CMS screens and editorial workflow

Navigation: Dashboard, Content, Programs, Announcements, Media, Settings; Admin additionally sees Users and Audit. Give staff task-oriented screens rather than exposing database table names.

The Content list supports title search, draft/published/archived state, program, activity/event flags, publication category, and translation availability. Use one combined list; optional saved filters can act as “Activities” or “Publications” views without creating separate records.

The content editor follows this order:

1. **Write:** English title, excerpt, rich text, author/byline, cover, and gallery. Slug and SEO sit in an expandable panel.
2. **Where should this appear?** Optional program selector and independent Activity, Event, Publication, and Featured controls.
3. **Relevant details:** event fields and publication template fields appear only when selected.
4. **Urdu, optional:** a separate tab in the same editor; show translation readiness and the ability to preview fallback behavior.
5. **Review:** actual site preview in desktop/mobile widths and both language modes.
6. **Save draft / Publish / Publish changes / Unpublish:** show saving state and specific validation errors.

Image uploads allow multiple selection, visible progress, retry, drag reordering, cover selection, captions, and alt text. Add a remove button per image. Users should never have to paste Cloudinary public IDs or resize images manually.

Save drafts with incomplete event/publication details; enforce required public fields at publish time. Preserve unsaved edits on recoverable errors and warn before navigating away. Do not silently save a partially uploaded gallery as a complete publication.

## 9. Publication templates and uploaded documents

Use one editor engine with four focused configurations and shared server rendering. Recommended candidate: Tiptap core with a validated JSON document and server-side static rendering; confirm the selected extensions' compatibility and licensing before adding them. No paid editor service is assumed. Tiptap documents JSON/HTML output and server rendering. [JSON/HTML output](https://tiptap.dev/docs/guides/output-json-html), [static renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer)

| Category | Editor configuration | Public presentation and document metadata |
|---|---|---|
| Opinion Articles | Byline, optional standfirst, paragraphs, H2/H3, quotes, links, captioned images | Existing editorial article style, readable measure, author/date, optional download |
| Research Papers | Author(s), abstract, keywords; section headings, tables with accessible labels, figures, reference list, optional manually managed citations | Abstract and contents navigation, numbered sections where chosen, references, PDF/download details |
| Short Stories | Author, paragraphs/dialogue, scene breaks, optional epigraph and illustrations | Quiet reading layout and preserved paragraph/scene spacing; no research-specific required fields |
| Newsletters | Issue/date, lead note, repeatable titled sections, image/link blocks, optional issue PDF | Issue heading and stacked sections within the current visual system; this is a website publication, not an email campaign sender |

Templates provide sensible defaults rather than requiring every possible field. For research papers, basic reference blocks and reference links are in scope; automated bibliography management and complex academic pagination are separate enhancements.

Switching category must preserve text and images. Warn about incompatible blocks and offer a reviewed conversion; never discard a table or reference list silently. Store a document/template version so future rendering changes can handle older records.

### Write or upload

Support these first-release modes for every publication category:

- **Write in CMS:** category-specific editor and public formatting.
- **Upload an existing PDF:** same category metadata form, readable HTML summary/abstract, cover, optional language-specific PDF, download control, and consistent category-specific page wrapper. Preserve the PDF's authored layout.
- **Both:** full HTML article plus the original PDF as a download.

An uploaded PDF cannot reliably be reformatted into a research paper or newsletter by assigning a category. Do not promise automatic PDF/DOCX conversion. PDF upload with category-specific metadata and presentation is the recommended interpretation; confirm whether editable DOCX import is actually required. If it is, plan a separate conversion-and-review step that surfaces unsupported formatting.

Cloudinary Free accounts block PDF delivery by default; verify and enable the relevant delivery setting before promising downloads, and test both original delivery and any preview. Keep PDF optimization optional and preserve legibility, text search, and signatures. [Cloudinary PDF documentation](https://cloudinary.com/documentation/pdf_optimization)

Use download-first PDF handling initially, rather than adding a large viewer or automatic cover transformation to every upload. Uploaded documents receive the same reference tracking and cleanup guarantees as images.

## 10. Cloudinary upload and optimization plan

### Account and upload boundary

Use the supplied Cloudinary credentials only on trusted servers. The cloud name and API key may be used in a signed upload flow; the API secret must never reach the browser.

Recommended flow:

1. Staff select images. The browser validates basic format/size and automatically preprocesses supported large photographs for upload efficiency, preserving orientation and useful detail.
2. The signer verifies the session, current upload permission, allowed placement, and rate limit. It creates a pending asset row and a server-chosen random public ID in a controlled environment prefix.
3. Return a signature for an allowlisted upload request and signed preset. Never sign arbitrary parameters supplied by the browser. Signatures have a validity window; enforce one-use finalization in our database rather than assuming the provider makes them one-use.
4. Browser uploads directly to Cloudinary, avoiding a large multipart payload through Vercel Server Actions.
5. The finalize endpoint verifies provider response authenticity and verifies asset identity, actual format, size, dimensions, resource type, and expected public ID against the pending upload. A response signature alone does not authenticate every metadata field; perform a provider-side lookup when needed.
6. Mark the asset ready only after validation. Failed or abandoned uploads remain pending for cleanup. Attach ready asset UUIDs when saving content.

Cloudinary documents backend signatures and response verification, and signed client uploads with server-held secrets. [Upload API flow](https://cloudinary.com/documentation/upload_images), [client-side uploading](https://cloudinary.com/documentation/client_side_uploading)

Choose explicit image and document resource types; do not use an unrestricted `auto` upload endpoint. Signed parameters alone are not a complete MIME/resource-type restriction. Enforce preset/account format restrictions and validate after upload. If the account cannot enforce the required file restrictions, use a bounded server upload handler for that asset class.

### Automatic optimization

Proposed defaults to test against real KIIR photographs:

| Asset/use | Starting policy |
|---|---|
| Photographic upload | Cap longest edge around 2,000–2,400px, never upscale; sensible lossy quality; automatic orientation handling |
| Small photo | Keep its useful dimensions; avoid unnecessary re-encoding that increases bytes |
| Logos/transparency | Preserve alpha and crisp edges; use a separate preset rather than converting all files to JPEG |
| Small card | A bounded rendition around 320–640px depending on actual layout/device density |
| Featured/article image | Renditions around 960–1,600px, with accurate `sizes` and no layout shift |
| PDF | Separate document policy; no photographic resize/compression preset |

Browser preprocessing improves transfer size but is not the enforcement boundary. Apply an incoming dimension/quality transformation on Cloudinary so the retained original is bounded even if browser processing is bypassed. The photographer's full original is not retained in Cloudinary by default; keep source archives separately if needed.

Use `q_auto` as appropriate for quality. Use `f_auto` **at delivery**, never in an incoming transformation: automatic format depends on the requesting browser. Incoming transformations can reduce the stored original; delivery transformations produce renditions. [Incoming/eager transformation rules](https://cloudinary.com/documentation/eager_and_incoming_transformations)

Use a Cloudinary-backed `next/image` loader or an equivalent controlled responsive-image helper so Cloudinary performs the resizing/format work. Avoid routinely passing already optimized Cloudinary images through a second Vercel optimization pipeline. Restrict delivery hosts/paths, cap width variants, reserve dimensions/aspect ratios, lazy-load below-the-fold media, and prioritize only the likely largest above-the-fold image.

Start with a finite width set and a small number of crop profiles; do not generate a new transformation for every CSS pixel. Keep URL construction centralized and versioned. Do not fetch Cloudinary Admin API data during public page requests. Browse/filter the CMS media registry in Postgres.

Initial upload limits should be configurable after testing the account's actual per-file limits: for example, browser-preprocess ordinary camera images automatically toward a low-megabyte upload; reject corrupt, unsupported, or extreme files with a clear message. Do not claim unlimited file sizes or enforce a fixed byte target that damages Urdu text, charts, or logos.

## 11. Media replacement, deletion, and orphan cleanup

Postgres and Cloudinary cannot participate in one atomic transaction. Use a **transactional cleanup queue** to avoid broken content and leaked storage.

### Replace an image

1. Upload and verify replacement B; image A remains attached until the save succeeds.
2. In one database transaction, save the content/program/settings update, attach B, remove the relevant A reference, write audit, and create a deduplicated cleanup job for A if it has no remaining live/draft references.
3. Commit. On a database failure, the record still references A and B is an unattached upload eligible for cleanup.
4. Invalidate affected public data/pages after commit.
5. The worker locks A's registry row, rechecks every reference, and moves A to a deletion state that prevents new attachments. Concurrent attachments use the same locking/state rule.
6. Destroy the correct Cloudinary asset using stored identity and resource/delivery type, with CDN invalidation. Treat an already absent asset as an idempotent success.
7. Record completion or retryable failure; keep a small tombstone for troubleshooting.

Use new public IDs for replacements instead of overwriting a shared asset in place. Another article using A must keep its unchanged image.

### Delete content

Archive/unpublish is a reversible editorial action: hide the item and retain its media while the item can be restored. **Permanent Delete** removes the record's current draft/published references and queues every now-unused image/document. Clearly distinguish the two controls. Permanent deletion can have a confirmation in the CMS because it removes media as well.

The same mechanism applies to program images, cover images, inline body images, gallery items, PDFs, branding, and social sharing images. Body image nodes reference registered asset UUIDs, not arbitrary unmanaged HTML URLs. Reconcile references when saving or importing a document.

If an asset is shared by another article, program, or site setting, retain it. Delete only the removed owner's reference. This is essential to satisfy cleanup without breaking other content.

### Reliable execution

Use a small batch worker invoked by Supabase Cron, initially every 10–15 minutes, plus an optional bounded immediate attempt after a successful user action. Durability lives in `media_jobs`; do not rely on a detached promise or a Vercel request remaining alive. Supabase Cron can invoke database functions or make HTTP calls to an Edge Function. Protect invocation credentials in server secrets/Vault. [Supabase Cron](https://supabase.com/docs/guides/cron)

Use leases for crashed workers, exponential backoff for provider/network/rate-limit errors, a deduplication key per asset/action, and an Admin-visible failed-job state. A daily sweep should find abandoned pending uploads older than a configurable window, initially 24 hours. A bounded reconciliation pass can inspect the CMS-controlled Cloudinary prefix for uploads whose database finalization failed. Never delete unrelated account media or the legacy archive based on a filename guess.

CDN invalidation is not instantaneous. Cloudinary documents propagation taking seconds to minutes. Deletion requests must set `invalidate: true`; a successful database deletion alone does not remove cached copies. [Cloudinary deletion documentation](https://cloudinary.com/documentation/delete_assets)

Cache invalidation must occur before destructive cleanup of previously published assets. If revalidation fails, keep the durable job pending and retry the callback before deleting media still referenced by cached HTML. Keep a short bounded grace interval for already-open pages. No system can retract a copy already downloaded by a visitor.

Old snapshots must not accidentally retain image references forever. Only current draft/published snapshots are retained for editing; audit summaries do not preserve deleted media. If historical restore is added later, explicitly choose retention rules rather than claiming both immediate deletion and indefinite media recovery.

Default Cloudinary public delivery is not draft-file confidentiality. Draft database records and previews are protected; if draft uploads must also be confidential by URL, use authenticated asset delivery and test publication transitions as a separate security requirement.

## 12. Cloudinary free-tier budget

Cloudinary currently documents 25 Free-plan credits shared by transformations, storage, and bandwidth. They are not three separate full allowances. Original assets, retained derivatives, and enabled backups can contribute storage. Verify the actual account quota and usage before implementation and after migration. [Billing and plans](https://cloudinary.com/documentation/billing_and_plans)

Operational policies:

- Optimize originals during upload, reuse registered assets, and remove abandoned/replaced assets reliably.
- Generate only the image widths/crops actually used. Avoid eager generation of every possible format/size.
- Keep public delivery cache-friendly and URLs stable; do not add cache-busting query values on every render.
- Fetch usage in an Admin-only cached report or scheduled check, initially daily, not on every admin keystroke or public request.
- Show warning thresholds such as 70%, 85%, and 95% of the account allowance. These are proposed application thresholds, not provider guarantees.
- Track stored bytes, successful upload counts, cleanup backlog, and image delivery size. Treat provider usage as authoritative for billing.
- Do not upload all 1,103 recovered assets by default. Migrate referenced, reviewed assets; keep the full archive outside Cloudinary.

Illustrative sizing, not a quota promise: 500 originals averaging 350KB use about 175MB before derivatives; five renditions averaging 80KB each add about 200MB. Traffic and cache misses can matter more than the original inventory. Measure actual bytes and provider reports rather than predicting cost from article count alone.

## 13. English and optional Urdu

Maintain English and Urdu together in the same editorial record. Do not auto-translate and do not fill Urdu with copied English. Track whether an Urdu content version is missing, in progress, or ready to publish.

For article/publication translation, publishing Urdu requires a translated title and usable body, or the appropriate document and summary in document mode. Partial work can be saved as an Urdu draft. Programs and brief announcements can use field-level optional translations with accurate block language.

Recommended public URL strategy: retain current English URLs and add `/ur` equivalents. The language control remains in its present location but navigates to the server-rendered equivalent route while preserving article/program/filter context. A cookie can remember preference without making an English canonical URL change its primary language by visitor cookie. This adds addressable Urdu content and consistent metadata; confirm the URL change as a product decision rather than treating it as already requested.

Fallback rules:

1. Urdu requested and published Urdu content exists: render Urdu.
2. Urdu requested and no ready Urdu article/publication exists: render the complete English article in the Urdu site shell, with the article marked `lang="en" dir="ltr"`.
3. Optional translated excerpts, captions, program fields, and UI labels use their own actual language; mixed-language blocks receive appropriate direction and bidi isolation.
4. Urdu draft text is never leaked through public read permissions or previews for anonymous visitors.
5. Show actual translation availability; a translated title alone is insufficient evidence for an Urdu article body.

Keep Urdu Nastaliq typography and readable line height; apply it only to Urdu text. Test English fallback inside Urdu pages, numbers, URLs, phone numbers, punctuation, captions, tables, and narrow screens. Decide full-shell mirroring with screenshots; do not reverse the editorial layout merely by setting every element to RTL.

Translated pages get language-specific metadata and reciprocal alternate-language links only when a real translation exists. A fallback-only Urdu URL should canonicalize to the English item and stay out of the Urdu sitemap/alternate-language set to avoid advertising a nonexistent translation.

If the client chooses to retain cookie-only language switching, support it, but document the weaker language-specific URL/SEO behavior and account for cookie-dependent caching. URL-based language routing is the recommended plan.

## 14. Landing page selection rules

Preserve the current arrangement: navigation, ticker, featured display, upcoming events on the right, recent feed, recent publications, and program cards.

| Module | Database rule and empty state |
|---|---|
| Ticker | Enabled announcements within their optional visibility window, ordered by staff order; hide the strip when empty |
| Featured carousel | Published explicitly featured records first, ordered by feature order then publication time and ID; fill remaining slots with newest distinct records up to the existing capacity; if none are marked, show newest records |
| Upcoming events | Published event records with `starts_at > now()`, excluding canceled events; earliest start first, then ID; no need for a program association |
| Recent feed | Published content by publication timestamp descending, then stable ID; the homepage shows a bounded first batch and real subsequent pagination |
| Recent publications | Published records with nonnull publication category; newest publication timestamp first |
| Programs/cards/counts | Active programs ordered by staff; count distinct published content IDs, not matching classification badges |

“Upcoming” means not yet started. Ongoing events remain in Events and on their article page; an “Ongoing” homepage group is optional rather than silently changing this definition. Store event instants as `timestamptz` with an IANA display zone, default Asia/Karachi. Support optional end, venue/online URL, registration link, status, and all-day mode with clearly defined local start/end boundaries. Keep publication dates independent.

Time-based visibility changes need expiry-aware caching even if nobody edits a record. Revalidate upcoming events and scheduled announcements at short bounded intervals or at the next relevant boundary. Time conditions and database visibility must agree.

The live site's current empty Upcoming list is consistent with its demonstration event dates having passed by 25 October 2026. Do not manufacture future events or import demo dates as real organization commitments.

Each content record appears once within a particular list even if it matches several classifications. It may appear in Featured, Recent, and Recent Publications because those are separate homepage modules. Optional cross-module suppression can be added later if the client prefers it.

## 15. Ticker editing and accessibility

Use a dedicated announcement list/editor with text, optional Urdu, inline link controls, enabled state, order, and optional visibility dates. Allow plain text without a link and multiple linked text spans within an announcement.

Example document:

```json
[
  { "text": "New registrations are open for our volunteer service. " },
  { "text": "Click here", "href": "https://example.org/register" },
  { "text": " to register." }
]
```

Render text and anchor nodes from a small validated schema. Do not allow arbitrary HTML, scripts, images, nested links, or unsupported protocols. Default to internal relative paths and HTTPS external URLs; validate destinations on the server.

Preserve the strip's maroon visual design and scrolling behavior. Pause on hover and keyboard focus, offer an operable pause control, respect reduced-motion settings, and keep duplicated marquee content out of the tab order and accessibility tree. Avoid a constantly reannouncing live region. An announcement's linked words should be the clickable region, rather than wrapping the entire message in an article-only link.

## 16. Contact, social links, and other site settings

Make Facebook, Instagram, X, LinkedIn, mobile/phone, website, physical address, and the existing email field optional. Normalize blank strings to null. Validate provided URLs and telephone/email formats; do not require a platform field merely because the old schema did.

One settings source must feed TopBar, footer, Contact page, article support cards, metadata/structured organization data, and any other shared display. Render an element only for a nonempty valid value; hide the social group/contact heading when its entire group is empty. Clearing a field intentionally must not activate a seed-data fallback.

Support optional Urdu address/organization text with English fallback. Render phone links with normalized dialable values and human-readable labels. Keep the website URL distinct from email. Show no guessed account links or placeholder phone/address in production.

Carry forward editable organization/about copy and branding from the existing settings design, with a managed logo/image reference where appropriate. Protect branding and staff access settings as Admin-only. Secrets and internal worker configuration belong in environment/secret storage, never publicly readable site settings.

The current Contact form can remain, but replace implementation-oriented errors with clear user-facing text. Add maximum lengths and rate limits. Restrict reading to authorized staff; do not return other visitors' submissions. A server-only submission boundary can close the existing unrestricted anonymous insert path; test that direct API access cannot bypass validation/rate controls. An outbound reply/email system is outside this CMS plan.

## 17. Data access, performance, SEO, and safety

### Query and cache design

- Listing queries fetch cards only: IDs/slugs, localized display fields, dates, classifications, programs, and cover metadata. Do not include full body documents in feed payloads.
- Article queries fetch one published record by indexed slug plus its references. Share the read between page and metadata generation within a request.
- Filter and paginate in SQL/PostgREST; cap request sizes, validate page/filter inputs, and use deterministic secondary sorting. Begin with ordinary numbered archive pages; use a cursor for large endless feeds if necessary.
- Use database aggregates for program counts and multitype stats; a record can count in both activity and event totals while the total stays distinct.
- Load the editor only on admin routes. Do not send editor bundles, unpublished translations, or both full language bodies to every public listing.
- Keep public read clients independent from staff cookies. Never share authenticated Supabase clients across requests.
- Start SSR without persistent full-page caching. If adding shared caching to public queries, tag content, programs, settings, and homepage modules explicitly and invalidate after commit.

For Next.js 16, `updateTag` provides immediate read-after-write invalidation from Server Actions. Authenticated callback Route Handlers can use `revalidateTag` with the appropriate profile, including immediate expiry for takedowns. Do not use stale-while-revalidate semantics for removing content that must disappear promptly. [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag), [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

If revalidation fails after a successful database commit, keep a durable retry marker and report that publication succeeded while public refresh is retrying. Avoid encouraging duplicate content creation. Do not delete old image files before cached pages have been invalidated.

### SEO

Use server-rendered title/body and meaningful headings. Add per-item metadata, clean text descriptions, canonical URL, Open Graph/Twitter image, published/modified dates, and suitable Article/Event/CreativeWork and breadcrumb structured data. Never invent event location, author, or dates merely to fill schema fields.

Create a dynamic sitemap for published items/programs and genuine Urdu variants. Implement RSS because the current footer advertises `/rss.xml`; verify it actually returns a feed. Exclude admin, previews, drafts, archive filter duplicates, and fallback-only translations from indexing as appropriate. Access controls protect drafts; robots rules alone do not.

Introduce `/publications`, update navigation/breadcrumbs/title/chips/filters/Urdu strings, and permanently redirect `/news` while preserving relevant query parameters. For imported legacy content, redirect **every verified original and category-prefixed path** directly to its one canonical item URL. Avoid redirect chains. A removed item without a relevant replacement may return 404/410 rather than redirecting everything to Home.

### Security and operational behavior

Validate inputs server-side, sanitize imported/rendered rich text, allowlist links and managed image sources, and escape JSON-LD. The sanitizer is needed even for Admin-authored content because imported HTML and compromised staff sessions are possible input paths. Apply CSP and other response headers appropriate to Next.js and Cloudinary without breaking fonts/images/preview.

Protect state-changing endpoints against cross-origin misuse, constrain redirect destinations, rate-limit login/upload/contact endpoints, and keep preview authorization server-side. Log useful request IDs and safe errors; never passwords, auth tokens, API secrets, or complete private message bodies.

Publication safety includes clear separation between RLS-protected drafts and public data, no public catalog of pending assets, and no anonymous access to job/audit/user administration. Use security-invoker views. If a private permission helper genuinely needs elevated database privileges, keep it narrowly scoped in a nonexposed schema, fix its search path, revoke default execution, derive the user from `auth.uid()`, and verify its grants and nonrecursive policy behavior.

## 18. Migration and cutover

### Prepare without damaging the working frontend

1. Inventory the actual remote project, applied migrations, table grants/RLS, runtime version, Auth provider settings, and Cloudinary usage through read-only checks before schema work.
2. Back up actual database state and retain the original exports/media unchanged. Determine whether any draft schema or seed has already been applied; local files are not proof.
3. Use a development database/project for migration rehearsal. Do not create paid branches or new services without checking the account's cost/approval constraints.
4. Prefer forward migrations. Do not rewrite applied `0001`–`0003` history. Existing `categories` can be renamed or adapted to `programs`; keep compatibility until both read and write paths are migrated.
5. Explicitly migrate old `type` values into independent flags. `activity` maps to Activity; `event` maps to Event plus reviewed dates; `publication`/`news_publication` need category review. Do not assign a research/opinion category purely by slug.

### Migrate the approved seed and real content separately

The four current program records are required initial data. Demonstration articles, guessed contact details, and placeholder event dates are not automatically real launch content.

For historical content, produce a review manifest with source IDs/namespaces, title, candidate public match, original URLs, intended new slug, program mapping, classification, publication category, media recovery status, and import decision. Preserve uncertain rows for review instead of deleting them.

Import in this order: current programs → reviewed referenced media → content drafts → program/media relationships → announcements/settings → redirects → editorial review → publish approved records. Idempotency keys use source namespace + source identity; record checksums and errors so a failed batch can resume safely.

Rewrite inline media references to registered assets, sanitize legacy HTML, recover author headings into bylines where reliable, and review date ambiguity before converting to UTC. Never infer future event timing from a legacy publication date. Do not populate missing Urdu bodies from machine translation or seed copy.

Earlier notes report missing media from a dead legacy domain and many unreferenced files. Revalidate exact counts and produce a missing-asset report. Keep unreadable/unmatched media in the local archive; a file unreferenced by the crawler is not automatically disposable. Pick intentional fallbacks for genuinely unrecoverable assets.

### Production cutover and rollback

Deploy additive database changes and compatibility reads first; rehearse import and RLS on staging; then deploy CMS/auth and the new public adapters together. Check normalized environment variables in Vercel Preview and Production separately, with a production site URL for canonical links. Keep preview data/media isolated from production or use tightly scoped prefixes and cleanup ownership.

Before switching public reads, confirm four programs, reviewed publication categories, valid image URLs, no demo fallbacks, redirects, and representative EN/UR pages. Use a short editorial freeze during final import/reconciliation. Do not automatically modify the old domain/DNS as part of schema deployment.

Keep a rollback-compatible application build and database backup. Prefer rolling the application back through compatibility adapters rather than reversing a destructive schema change. Delay dropping old columns/tables until verification is complete. Physical Cloudinary deletion is irreversible without separately configured backups; a database rollback cannot restore deleted media. Retain migration source files for recovery while runtime cleanup follows the agreed lifecycle.

## 19. Implementation phases and completion gates

| Phase | Work | Completion gate |
|---|---|---|
| 0. Baseline and decisions | Read-only service inventory, design screenshots, normalize environment contract, settle role/document/language choices | Current state and launch data scope recorded; no credentials exposed |
| 1. Auth and admin shell | Supabase login without confirmation, request-scoped sessions, protected layout, two roles, user provisioning | Admin and Content Manager can sign in; unauthorized/disabled users cannot access staff operations |
| 2. Schema and policies | Forward migrations, independent classifications, draft/published snapshots, grants/RLS, audit, job registry | Direct anonymous/staff API tests prove visibility and role boundaries; migrations replay cleanly |
| 3. Media foundation | Signed uploads, automatic optimization, finalize verification, media references, retry worker | Replacement succeeds safely; failures leave the original working; unused assets are eventually deleted |
| 4. Programs | CRUD, reorder/visibility, four-program seed, deletion/reassignment | A fifth created program appears throughout the site without code changes |
| 5. Content and publications | Shared editor, four templates, event fields, gallery, EN/optional Urdu, safe preview/publishing | One record can occupy every requested combination and render correctly in EN/UR |
| 6. Homepage and settings | Inline-linked ticker, featured fallback, upcoming/recent queries, optional contact/social | Existing layout uses database content; empty fields disappear in every location |
| 7. Public SSR and SEO | Bounded server queries, localized routes, metadata, canonicals, redirects, sitemap/RSS | Content is readable in initial HTML; private content excluded; links and feeds verified |
| 8. Import, QA, release | Reconciled legacy manifest, reviewed import, failure/security tests, staff walkthrough, cutover | Acceptance matrix passes and rollback/runbook are usable |

Auth is the first development feature. Schema/permission design is settled alongside it before building writable editor screens. Media lifecycle comes before article uploads so cleanup is not bolted on after records exist. Each phase should ship a demonstrable vertical slice; do not treat a styled login page as finished authentication or a working upload as finished media management.

No fixed delivery date is assigned before the record reconciliation, remote configuration inventory, and publication-upload expectations are settled. The phases above define reviewable scope without pretending unknown content work has a predictable duration.

## 20. Acceptance and verification matrix

| Area | Required evidence before launch |
|---|---|
| Auth | Sign-in works without email confirmation; public signup unavailable; refresh/logout/expiry/disabled user handled |
| Authorization | Anonymous, Content Manager, Admin, and demoted/disabled sessions tested against UI and direct endpoints; role self-escalation and last-Admin removal blocked |
| Classification | Test all 16 combinations of program-present/activity/event/publication switches on one record; no program dependency; all four publication categories also tested |
| Draft safety | Save edits to a live article without changing public content; publish atomically; anonymous requests cannot retrieve draft text or translation |
| Programs | Create/edit/reorder/delete; fifth program reaches nav/footer/cards/selectors; delete preserves articles and detaches/reassigns links |
| Publications | Each template supports written and PDF modes; category switch preserves unsupported content for review; PDF download works on this Cloudinary account |
| Media | Multi-image order/cover/alt/caption; upload failure; abandoned upload; failed DB save; shared image; program/logo/PDF cleanup; duplicate retry; two concurrent workers; attach/delete race |
| Deletion | Cloudinary outage leaves a visible retry job; no unrelated assets deleted; no database/UI success falsely presented as confirmed physical deletion |
| Urdu | Fully translated, English-only, partial Urdu draft, blank Urdu, mixed captions, RTL tables, and English fallback in Urdu shell |
| Ticker | Plain announcement, multiple inline links, internal/external destination, protocol rejection, reorder, focus/pause/reduced motion, no duplicate focus targets |
| Homepage | Featured empty/partial/full; every classification can feature; stable newest order; no list duplicates; empty states; upcoming rollover/cancellation/local-time boundaries |
| Settings | Each social/contact field cleared individually and all together; no icons/links/placeholders remain; article and Contact page share values |
| SSR/SEO | Inspect initial HTML without JS for headline/body/links; metadata agrees with language; canonical/alternate links, structured data, sitemap, RSS, old-path redirects |
| Performance | Production-build card payloads contain no full body; bounded query count and query plans; responsive image bytes; editor excluded from public bundles |
| Content safety | Scripts, unsafe URLs, malicious pasted/imported HTML, oversized/corrupt media, forged finalization, and unauthenticated preview denied or sanitized |
| Operations | Migration replay, backup restore rehearsal, job retry recovery, safe error logging, production config validation, and documented Admin recovery |

Use focused database/RLS integration tests for security and transactions, browser tests for critical staff/public flows, and screenshots at desktop/tablet/mobile for existing design fidelity. This planning task did not execute those implementation tests.

Target standard Core Web Vitals thresholds in representative production measurements: LCP at most 2.5s, CLS at most 0.1, and INP at most 200ms, measured at the 75th percentile and segmented by mobile/desktop. Treat field results as a post-launch measurement; a staging Lighthouse run is not proof of real-user performance. [Google's Web Vitals guidance](https://web.dev/articles/vitals)

## 21. Configuration, current platform considerations, and handover

Recommended environment contract:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY                  server only
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET                server/worker only
NEXT_PUBLIC_SITE_URL
INTERNAL_REVALIDATION_SECRET         server/worker only
```

The database password is for protected migration/maintenance tooling, never the public app. Map/rename the supplied variables deliberately rather than exposing the secret key to make the public loader “work.” Validate secrets independently for Vercel and Edge Function environments. No environment values belong in the plan, Git, screenshots, or client bundles.

During this research, Supabase's changelog identified two relevant platform considerations: use Node.js 22 or later for the current client libraries, and grant newly created tables access explicitly where needed. The changelog describes automatic Data API table exposure changing for all projects on 30 October 2026. RLS and table grants are separate requirements; test both rather than copying the old migration's assumptions. [Supabase changelog](https://supabase.com/changelog)

Keep new migrations versioned, generated through the installed CLI's supported workflow, and tested against a clean development database plus the current schema. Generate matching TypeScript types. Update the README and supersede stale project-note sections after implementation; do not leave setup instructions that silently restore seed mode or refer to Supabase Storage for Cloudinary assets.

Handover should include a short staff guide for login/reset, content combinations, the four publication modes, Urdu fallback, replacing/removing images, program deletion, and optional contact settings. Include an Admin runbook for provisioning, backups, usage warnings, failed media jobs, deploy/rollback, and export.

## 22. Decisions and assumptions to carry into implementation

The plan is complete enough to begin the baseline/auth phase. The following product choices remain explicit rather than hidden in code:

| Decision | Recommended default |
|---|---|
| Content Manager publishing rights | Can publish editorial content; user management, program deletion, permanent record deletion, and branding stay Admin-only |
| Multiple program associations | Preserve existing many-to-many capability; the UI defaults to a simple optional selector |
| Meaning of uploaded publication formatting | PDF + category metadata/presentation and optional HTML body; no automatic PDF/DOCX reformatting |
| Urdu URLs | Preserve current English URLs and add `/ur` routes with real translation metadata |
| Historic import scope | Four current programs required; import reviewed substantive legacy content; quarantine structural/demo/unmatched records |
| Delete versus archive | Archive retains recoverable content/media; permanent delete triggers automatic unused-asset cleanup |
| Featured ordering | Marked content first, optional explicit order, recent records fill remaining slots |
| Upcoming definition | Future start time; ongoing events remain in Events |
| Draft file privacy | Protected database/editor access; authenticated Cloudinary file delivery only if file-level confidentiality is required |
| Account limits and operations | Confirm actual Supabase/Cloudinary/Vercel plans, quotas, backup options, and worker availability during baseline |

Additional enhancements such as a generic page builder, custom role designer, approval queues, full historical revision restore, automated translation, email newsletter sending, and complex document conversion are outside the initial CMS unless separately requested. Existing About/organization/branding settings are retained and made editable without turning the site into a generic administration platform.
