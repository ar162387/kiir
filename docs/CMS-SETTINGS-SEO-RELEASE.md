# Website settings, language routes and release

Implemented 25 October 2026. Historical content import is excluded by request.

## Staff handover

Open `/admin/help` for the in-app walkthrough. It covers classifications, the
four publication categories, formatting, PDFs, drafts, preview/publish, Urdu,
media cleanup, settings, staff accounts and recovery. Use individual staff
accounts. Admins provision/reset accounts in Staff & access. Temporary passwords
must be changed on first sign-in; disabled/demoted memberships take effect on
existing sessions.

`/admin/settings` contains Contact details, Social links and Announcements for
both roles. Admins also see Organization & branding and About KIIR. Every
section saves independently, checks its version, and records an audit event.
Conflicting saves require a reload instead of overwriting another person's work.

Contact/social fields are optional. Clearing them removes their links/icons and
empty contact groups from the top bar, footer, contact page, article support card
and organization structured data. No guessed address, phone or email is seeded.
Existing organization/About design copy is carried forward for editing; no
historical articles, events or recovered media have been imported.

Announcements consist of ordered plain-text or linked-word segments. They can
have optional Urdu segments, be hidden, reordered or removed. Internal paths and
HTTP/HTTPS URLs are validated on the server/database. The public strip has an
explicit pause control, pauses for focus/hover, respects reduced motion, and
keeps the duplicate marquee text out of keyboard/accessibility navigation.

Organization logos use the managed image registry. Replacing a logo preserves
the original packaged `/logo/kiirlogo.png` when restored after an upload. It preserves
any other current owner of a managed file; the scheduled worker deletes it after the
last reference is removed. Arbitrary client-provided image URLs are not trusted.

`/contact` and `/ur/contact` store bounded enquiries in the private Admin inbox
at `/admin/messages`. Submission uses server-side validation, a honeypot and a
persistent per-IP limiter. Public direct inserts are revoked. Admins may mark
messages read/unread. This does not send email or implement an email helpdesk.

## Language and search delivery

English routes retain their established URLs. Urdu routes use `/ur`, including
archives, programs, article pages and contact. Language selection navigates to
the matching URL while retaining query parameters. Shared internal links,
archive filters and pagination preserve the selected language. The proxy derives
language from the URL and overrides any caller-supplied language header.

Initial HTML, document language/direction, metadata and server-selected content
agree with the URL. Unfinished article translations remain private. An English
article in the Urdu shell uses English typography/direction, and its canonical
points to the English article; Urdu article alternates are advertised only for
ready translations. Text-field fallbacks explicitly mark their actual language.

Pages have canonical/hreflang metadata. Articles have Open Graph/Twitter data and
safe Article/ScholarlyArticle/Event JSON-LD; the homepage has Organization data
from the same settings source. JSON-LD escapes HTML delimiters. `/news` and
`/ur/news` redirect permanently to their publications archives, retaining filters.
Current program/article aliases retain their redirects. Historical URL crosswalks
remain part of the excluded historical import.

`/sitemap.xml` reads bounded body-free projections and includes published content
only. Its current single-file guard supports fewer than 24,000 articles; split
it into sitemap files before that threshold. `/rss.xml` and `/ur/rss.xml` expose
the latest 50 published summaries. Private previews/staff routes are noindex and
uncached. Preview deployments disallow indexing. Public pages render per request.

## Runtime and file delivery

The runtime needs the Supabase URL, publishable key, server secret key and
Cloudinary cloud/API credentials. Database passwords belong only in protected
maintenance tooling. `NEXT_PUBLIC_SITE_URL` is the canonical production origin.
Never place a secret key under a `NEXT_PUBLIC_` name.

PDFs upload directly from the staff browser to Cloudinary using a short-lived
signed upload. Only a small preparation/confirmation payload crosses the app
server, avoiding Vercel's request-body limit. Confirmation checks the actual
provider identity, resource type, byte limit and PDF header independently of the
browser. The 10 MB limit matches the configured provider's raw-file limit.
Private documents require staff access. Public downloads require a live file
reference, and the route streams a short-lived authenticated provider response.
See the [Vercel payload limit](https://vercel.com/docs/functions/limitations).

Account creation is staff-only even though the hosted Auth settings flag still
allows signup. A private one-use provisioning row authorizes an account UUID and
email; only the service-only issuer and Auth Admin API can choose that UUID.
The Auth users-table trigger rejects every unapproved insertion. Public signup
ignores caller-supplied IDs and cannot consume that authorization. User metadata
is not an authorization source. Existing accounts are unchanged. Create staff
through the CMS or the supplied provisioning helper; raw dashboard/Admin API
creation without authorization intentionally fails. This behavior was verified
against the actual Auth API, including forged public payloads.

## Backup and recovery

Run `npm run cms:backup` with `PG_DUMP_BIN` pointing to a PostgreSQL client at
least as new as the hosted server (currently PostgreSQL 17). Backups are written
to ignored `.cms-backups/<timestamp>/` with private file permissions. The archive
includes public/private CMS schema, data, grants and functions; rate counters and
short-lived provisioning rows are recreated empty. Auth identity UUIDs and the
custom Auth trigger definition are exported separately for relationship integrity.

Treat the archive as sensitive: it includes private drafts, staff identities and
contact messages. Keep encrypted off-device copies under the organization's
backup policy. The local backup is not a scheduled off-site backup service.
It excludes Auth credentials/sessions, Vault secrets, provider configuration and
Cloudinary file bytes. A database restore cannot recover physically deleted
Cloudinary files. Hosted Auth recovery and file backups are separate operations.

Rehearse into an isolated database, never the running project:

1. Prepare the platform roles and Auth schema/identities.
2. Restore `cms.dump` with a matching `pg_restore`, retaining grants.
3. Restore `auth-guards.sql` after identities and private provisioning functions.
4. Verify record counts, FKs, RLS, invoker views and anonymous denial checks.
5. Restore provider credentials separately through the owner-run media setup;
   verify the cleanup cron, then test a disposable upload and download.
6. Validate staff sign-in and public snapshots before routing any traffic.

The rehearsal in this run used an isolated PostgreSQL 16 server with a
PostgreSQL 17 archive. Only the unsupported `transaction_timeout` SET statement
was omitted. Schema/data/relationships and restored access restrictions passed.
The final clean backup restored with four programs, five settings sections, one
real staff membership and zero test articles. Anonymous draft reads/writes remained
denied. All 13 application migrations also replayed in an empty isolated database;
Supabase-managed extension installation and cron scheduling were excluded from
that local replay and verified separately on the actual project.

## Operations and rollback

`npm run cms:health` reports settings availability and cleanup state without
printing private messages or provider secrets. The configured worker runs each
minute independently of Vercel. Admins can retry from Media library; failed jobs
remain visible. Fix provider credentials/quota/connectivity before retrying.
Never mark a provider deletion complete without provider confirmation.

The configured Cloudinary account was verified as Free with 25 shared credits,
0.18 used (0.72%) in its last reported usage, and a 10 MB image/raw-file limit.
Usage is dated by the provider and should be checked again after real content
uploads; it is not a future usage guarantee.

Deploy the same versioned source and lockfile with runtime variables configured.
The release is prepared as a Vercel preview by default. Promotion to production
is a distinct release action. Keep the previous deployment for application
rollback. Preserve forward database migrations and new tables during app rollback;
do not drop content or disable privacy to make an older build work. Restore data
only after a specific recovery assessment, not as an automatic deployment rollback.

A rollback to a pre-CMS account-creation build also needs a compatible provisioning
adapter; its unapproved Auth inserts are intentionally blocked by the new guard.

## Verification evidence

- Unit/rendering/URL validation suite: 13 checks.
- Live settings/contact/shared-logo suite: 19 checks, including physical provider
  deletion after the last reference and preservation while another owner remains.
- Staff-only provisioning: 5 checks; authentication/RLS regression: 14 checks.
- Content classifications and draft safety: 13 live checks from the content stage.
- Public English/Urdu routes, sitemap/RSS, redirects, initial HTML, alternates,
  private preview exclusion and intentional blank settings were checked over HTTP.
- Isolated Chrome: real formatted edit → save draft → private preview → publish →
  public output. Computed editor/preview/public typography, alignment, lists, table
  borders and captions matched. Images loaded. All four publication templates
  preserved the edited document and displayed only their relevant wrapper fields.
- Chrome at 390 pixels: English and Urdu article bodies had no page overflow;
  Urdu used RTL/Nastaliq. Screenshots are in ignored `output/playwright/`.
- Chrome settings: inline announcement links, unique focus targets, pause,
  reduced motion, localized Urdu destinations and shared contact values passed.
- Chrome uploaded an 8,580,599-byte PDF directly and downloaded the exact original
  through the public route locally and on the deployed Vercel preview. Streaming allows 120 seconds for the provider response.
- The original header/footer logo was visually verified after replacement/restore
  and cleanup; a dedicated regression prevents clearing its packaged path.
- Production build, lint, dependency audit, restored permissions and public
  bundle secret/editor-exclusion checks are part of the final release gates.

The old formal privacy/terms copy remains the existing editorial text. Software
implementation does not supply legal sign-off or verified organization contact
information. Historical import remains excluded.

Verified Vercel preview (Node.js 24, remote build passed):
https://kiir-arimgxj4i-ar162387s-projects.vercel.app

The preview was checked in isolated Chrome using a short-lived, origin-scoped
Vercel authentication header. Header/footer logos, public rich formatting, Urdu
direction, exact large PDF download, private settings/help and noindex delivery
passed. Disposable staff/content/files were removed after verification.

The production release target is https://kiir-opal.vercel.app in the same Vercel project.

## Navigation and working states

Public and CMS route boundaries stream skeleton placeholders while data loads.
Shared headers/sidebar stay usable during navigation. Internal links use Next.js
link status for a thin animated cyan line at the very top, without a navigation spinner or
floating notice.
Language changes and publication filters use router transitions with the same
feedback. Prefetched pages open immediately without an artificial delay.

CMS forms show disabled working buttons/spinners during sign-in, saves,
publishing, access changes and cleanup. Contact submission has matching feedback;
managed uploads retain their real progress/verification states. All new animation
respects reduced motion. Skeleton decoration is hidden from screen readers, with
a single loading status. Unsaved-editor cancellation runs before link navigation.

Release destination confirmed by owner: existing Vercel production project.
The complete source is committed to `ar162387/kiir` on `main`; runtime secrets,
private credentials, browser sessions and backups remain outside Git.

Final loading checks in isolated Chrome delayed responses deliberately: public
header navigation, publication filters, EN→UR navigation and a subsequent Urdu
filter all retained the correct URL/content and cleared the top line. Reduced
motion disabled its animation. CMS navigation and a real unchanged contact
settings save showed the working state and prevented repeat submission.

## CMS form clarity and expanding text fields

The CMS now applies shared label/control styles to all internal forms, including
content filters and settings. Fields have visible borders, consistent focus
states, labels above values, and predictable section/action spacing. Content
language tabs, nested announcement parts, destructive buttons and the current
sidebar destination are visually distinct. The organization logo uses a
contained preview with upload controls alongside it on wider screens.

Editorial/settings text fields soft-wrap and grow vertically to show their full
values, then shrink when text is shortened. Width changes and hidden language
tabs trigger remeasurement. Single-line values retain their original semantics;
visual wrapping does not insert saved line breaks. Password, date, number and
other typed controls retain their appropriate native input behavior.

Chrome review covered 12 internal routes: overview, content list/new editor,
program list/new editor, media, settings, staff guide, account, staff access,
audit and inbox. Visible controls had labels and borders, and desktop pages had
no horizontal overflow. A long organization name grew and shrank without
clipping at desktop and narrower widths. A disposable long-title draft survived
save/reload/private preview unchanged, then was deleted. Public settings were
not saved or altered during the design checks.
