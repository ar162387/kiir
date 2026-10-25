# Articles and publications

Implemented 25 October 2026. Open `/admin/content` for all editorial content.

## Staff workflow

Create one content record and choose any combination of programs, Activity, Event and a publication category. All associations are optional and independent. Each published record has one `/articles/[slug]` URL; matching archives, program pages and homepage sections link to that same record. Program associations use UUIDs, so changing a program URL does not detach articles. Deleting a program removes only its associations, preserving articles.

English title and a unique URL are required to save. Generate a URL from the title or edit it yourself. Incomplete event and publication details can be saved as a draft. Publishing requires a meaningful summary and readable body or a managed PDF; event records also need a start. Drafts are separate rows from the public snapshots: **Save draft** never edits the live article. **Publish changes** atomically replaces the public snapshot and its program/file references. A version check rejects stale edits. Changing a published URL creates a permanent redirect from the previous one; changing only the draft URL leaves the existing public URL working.

Unpublish and Archive hide the public page and retain the working copy and its files. Publish restores it using the current draft. Admins alone can permanently delete a record after checking the confirmation. Permanent deletion removes current draft/published references and queues every unused managed file. Files shared with another program or current draft/published article remain intact.

The list supports title search, status, publication category, program and pagination. The activity log records draft saves, publishing, unpublishing, archive and permanent deletion.

## Editor and formatting contract

The editor uses pinned MIT-licensed Tiptap 3 packages. Supported controls are paragraphs, H2–H4, bold, italic, underline, strike, superscript/subscript, links, nested bullet/numbered lists, quotes, left/center/right/justified paragraphs, scene breaks, tables, and managed captioned figures. Table controls include adding/removing rows and columns, header rows, merging/splitting cells and resizing columns. Select an inserted figure to edit its caption and alt text. Undo/redo and normal Tiptap keyboard shortcuts are supported.

Editor content is structured JSON. Publishing does not trust browser-generated HTML. A recursive allowlisted renderer escapes text/attributes, permits only safe link schemes, resolves figure URLs from registered ready assets, and renders the supported blocks. Unsupported nodes/marks are rejected rather than accepted and silently dropped during publishing. Draft preview and public delivery call the same renderer. The editor, preview and public body share `app/editor-content.css`, including list markers, heading sizes, alignment, table borders/column widths, caption styling, scene breaks and Urdu typography. Table overflow stays inside a horizontally scrollable wrapper on narrow screens.

Formatting pasted from another application is normalized to this supported editor schema; arbitrary fonts, scripts, embeds, raw HTML, videos and Word layout are not editor features. The toolbar exposes only formatting supported by the publication renderer. Uploaded PDFs preserve their original authored layout; they are not automatically converted or reformatted into editable web content.

## Publication configurations

| Category | Relevant fields and public presentation |
| --- | --- |
| Opinion Article | Required byline, summary/standfirst, editorial headings, quotes, images and optional PDF |
| Research Paper | Required authors and abstract; optional keywords/references, section headings with generated contents navigation, accessible tables/figures, optional original PDF |
| Short Story | Required author; optional epigraph, scene breaks and illustrations; narrower reading measure and looser paragraph rhythm |
| Newsletter | Required issue/edition; optional editor/byline, lead summary, repeated section headings, images/links and optional issue PDF |

Changing category preserves document blocks, figures and entered metadata. Fields specific to a different category are retained for editing but not displayed by the selected public wrapper. There is no paid editor service, automated bibliography manager, DOCX conversion or academic PDF pagination service.

## Images and PDFs

Cover and gallery images use the previous stage's signed direct uploads and automatic resizing. Add up to 30 gallery images with alt text and optional EN/UR captions; insert a gallery image at the body cursor for an inline figure. Other gallery images appear below the article. Every inline, cover, gallery and document reference is derived from the saved document in the database, rather than trusting a browser-provided attachment list.

PDFs up to 10 MB upload directly to Cloudinary using a staff-only, same-origin, rate-limited signing endpoint. Server confirmation verifies the actual provider identity, size and `%PDF-` header before registering the original as a managed Cloudinary `raw` resource. File bytes bypass the Vercel request-body limit. The download endpoint checks for a reference from a currently live snapshot; private documents require active staff access. It streams an authenticated, short-lived provider download with a PDF content type, attachment disposition, `nosniff`, and private/no-store headers. No Cloudinary secret or reusable provider URL reaches the browser. Public route and signed provider PDF downloads were checked with a real disposable PDF; both returned HTTP 200.

The existing durable worker handles both image and raw-resource destruction. Current draft and current published references both protect assets. Replacing a draft file retains the live version's original file until the new version is published; discarding/deleting unused files eventually queues them. Unsaved uploads expire after 24 hours. Unpublished/archived records retain their files until permanently deleted. Cloudinary image URLs remain public-by-URL, as documented in the media stage; document route authorization is separate from that image delivery behavior.

## English and Urdu

Both language bodies have the same formatting controls. Urdu content is optional and can be saved privately while incomplete. Select **Publish Urdu translation when complete** only when the Urdu title and readable body or Urdu PDF are ready. Until then, the published snapshot excludes Urdu draft text and Urdu-only file URLs. Public language switching falls back to the whole English article with `lang=en` and `dir=ltr`, inside the Urdu site shell. Ready Urdu bodies use Nastaliq and RTL direction. The PDF download follows the selected content language. Shared author names, abstract, keywords, references and edition metadata currently use English fields; these are marked with their own language and direction.

## Public delivery

Public records come from `content_live`; working copies in `content_records` are staff-only. The body-free `content_catalog` view uses `security_invoker=true`, respects source-table RLS, and includes current program slugs without exposing draft associations. Database filters/counts/pagination drive feeds, activity/event/publication archives and program pages. Archive cards do not receive full body/editor JSON. Explicit features appear before a newest-content fallback; upcoming events use their independent future start, excluding cancelled/postponed events. Public pages are rendered per request and do not rely on a long-lived content cache.

`/publications` is the canonical publications archive. `/news` permanently redirects with query parameters preserved. Public routes no longer substitute demo articles after a database error or when no real content is published. The old demo/legacy data has not been automatically published: recovered historical content needs the editorial reconciliation/import stage. Ticker/contact/site settings remain on their previous path until the next stage.

## Operations and verification

Migrations in order:

- `20261024225047_cms_editorial_content.sql`
- `20261024225422_cms_publication_documents.sql`
- `20261024230001_cms_content_publication_guards.sql`
- `20261025091417_cms_public_content_catalog.sql`

All exposed tables have explicit grants and RLS. The private mutation helper has a fixed search path, revoked default execution and derives the active staff identity from `auth.uid()`. Clients cannot directly modify snapshots, attachments, aliases or associations. Its public wrapper is an invoker function. The only elevated helpers exist in the nonexposed private schema.

Run:

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
npm run test:content:integration
```

Turbopack's CSS worker cannot bind its required local port in this execution environment; the supported Webpack production builder was used. Package versions are pinned and the lockfile is included.

`test-content.mjs` verifies anonymous/outsider draft restrictions, all 16 classification combinations, public snapshot stability, partial Urdu exclusion, stale edits, the four categories, slug redirects, publish/unpublish/archive and direct-write denial. By default it removes its fixtures. `--keep-ui-fixture` keeps one marked test identity/article in the ignored `.cms-credentials-content-ui.json` for browser verification; remove that fixture after testing and never use it as a real staff account.

See CMS-SETTINGS-SEO-RELEASE.md for the completed settings, language and preview release stage. Historical import remains excluded.

### Evidence from this implementation run

- Unit suite: 10 passing checks; lint and the Webpack production build pass.
- Program/shared-media regression: 20 passing live checks; disposable fixtures removed.
- Live editorial integration: 13 passing checks, including every classification
  combination and all four publication categories. Disposable fixtures removed.
- Final public HTTP checks: all supported research fixture markup, caption and
  original PDF rendered; homepage, archives and program page returned HTTP 200.
  Other-category epigraph/issue fields were absent from the research layout.
- Removing files from a saved draft retained the live image/PDF references and
  queued no deletions. Permanent deletion denied anonymous PDF download; the
  durable worker physically removed both the disposable image and raw PDF,
  independently confirmed by provider HTTP 404. Test account/assets removed.
- Remote permission inspection confirmed RLS, SELECT-only public grants,
  invoker-secured catalog and the private helper's fixed search path.
- Desktop browser editor/public structure was inspected earlier in the run.
  Subsequent isolated Chrome checks completed preview/public formatting comparison,
  all four publication templates, and English/Urdu mobile checks with screenshots.
  See CMS-SETTINGS-SEO-RELEASE.md for current evidence.
