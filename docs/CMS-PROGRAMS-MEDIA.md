# Programs and managed images

Implemented 25 October 2026, following the authentication stage.

## Staff workflow

Open `/admin/programs`. Admins and Content Managers can create, edit, hide/show, and order programs. Admins can also permanently delete them. English name/description are required; the longer introduction, Urdu fields, and image are optional. English is used when a translated field is absent. Lower display-order numbers appear first, followed by name and stable identity.

The initial Human Rights, Climate Action, Training, and International Advocacy programs are ordinary database records. Navigation, footer, homepage program cards, archive metadata, and program pages query the active records without a four-program whitelist. An empty program table remains empty; it does not silently restore deleted seed programs. Existing local seed photographs are retained until replaced or removed.

Changing a slug records a permanent redirect from its previous URL. Existing alias URLs cannot be claimed by a different program. Concurrent edits use a version check: a stale save returns HTTP 409 and asks the editor to reload. Hiding a program removes it from public reads while staff can continue editing it. Deleting a program preserves articles; the content-table migration and permanent UUID-based article associations are the next stage.

## Uploads

Choose a JPG, PNG, or WebP file in the program editor. The browser corrects orientation and resizes the decoded image to a maximum 2,400px edge without upscaling. It uploads directly to Cloudinary using server-signed, server-selected parameters. The signed preset enforces allowed formats, disables overwriting, and applies an incoming 2,400px limit and automatic quality. PNG transparency is preserved. Ordinary users do not need to resize files manually.

The server verifies the image through Cloudinary's authenticated resource API before accepting it as ready. Browser-supplied dimensions, URLs, formats, and asset IDs are not trusted. Upload signing/finalization require an active staff membership and same-origin request, and have persistent per-user limits. Confirmation is idempotent for the upload owner. A failed confirmation can be retried without uploading again.

The picker can reuse one of the latest 100 ready images. `/admin/media` shows the latest 100 ready images and their program-reference counts. Image changes become effective only after saving the program; failed saves retain the original image. Unsaved uploads are cleaned up after 24 hours.

Current limits: source file up to 40 MB for browser processing, at most 80 million decoded pixels, optimized asset up to 10 MB, and JPG/PNG/WebP only. Extremely large, corrupt, or unsupported files receive an explanatory error. PDF/document uploads are part of the upcoming publications stage.

## Deletion lifecycle

Program triggers maintain image references, versions, redirect aliases, audit entries, and durable deletion jobs in the same database transaction. Normal staff API calls cannot forge media lifecycle fields or references. Before a job starts deletion, the worker locks the asset and rechecks all references. Once deletion starts, new attachments are rejected. An image shared with another program stays intact.

Supabase `pg_cron` runs `cms_private.process_media_cleanup()` every minute. The worker dispatches at most five Cloudinary deletion requests per pass using `pg_net`, then collects provider responses on subsequent passes. It uses `invalidate=true`, handles already-absent assets idempotently, retries failures with bounded exponential backoff, and marks repeatedly failing jobs for Admin attention. It operates even when the local app/Vercel instance is not running.

Provider credentials are encrypted in Supabase Vault under `kiir_cloudinary_cleanup`; they are never embedded in migration files or browser responses. Anonymous and authenticated API roles have no Vault schema access. Queued network requests contain a scoped signature and public API key, not the API secret. Deletion is restricted to the configured cloud and `kiir-cms/PROJECT_REF/` prefix. Existing unrelated Cloudinary assets are untouched.

Unused images enter a short grace period before deletion. Public program reads use request-time SSR rather than a persistent cache, so later requests see current image URLs. Already-open pages and previously downloaded copies cannot be recalled; CDN invalidation can take time.

The Admin's “Retry cleanup now” button resets failed jobs and starts a pass. A new pass may dispatch requests whose completion appears on the following scheduled run. The database queue remains the source of truth, rather than an in-memory/background application promise.

## Setup and maintenance

The applied migrations are:

- `20261024222213_cms_programs_media.sql`
- `20261024222530_cms_media_cleanup_worker.sql`
- `20261024223850_cms_program_conflict_status.sql`

Run the owner-only setup script with the existing server credentials to create/verify the restricted signed preset and install encrypted cleanup credentials:

```sh
npm run cms:setup-media
```

The script refuses an existing preset that does not match the signed/format/optimization policy. Rotate the environment credentials and rerun it when changing the Cloudinary secret. No Supabase management access token is needed for this database-backed scheduler.

Forward migrations must extend media references with real foreign keys when articles, publications, and site branding adopt managed assets. Those references must participate in the same cleanup checks before their first upload is enabled. Do not introduce arbitrary image URLs into rich-text documents without registering their assets.

## Verification

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:programs:integration
```

The live integration suite uses disposable staff accounts, programs, and two images. It checks public visibility, Content Manager permissions, optional Urdu, fifth-program creation, stale-edit conflicts, slug redirects, hidden-program access, invalid-image rollback, provider optimization, shared-image preservation, unauthorized lifecycle writes, durable cleanup, confirmed Cloudinary deletion, and blocked reattachment of deleted assets. Test programs/accounts are removed; pending media jobs remain durable if an external failure interrupts verification.

Browser verification also exercised staff sign-in, image selection and direct upload, reuse of the confirmed image, program creation, and the resulting public page and homepage entry. The temporary program and test identity are removed after verification. A screenshot of the successful save is in `programs-verification.png`.

Program management and the scheduler are configured in the website's Supabase project. Content, settings and the contact inbox now use that project too. A Vercel preview has passed release checks; the production release uses the existing `kiir-opal.vercel.app` alias. See [the release guide](CMS-SETTINGS-SEO-RELEASE.md).
