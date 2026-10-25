# KIIR search visibility and original-domain migration

## Delivered technical SEO

The starter favicon is replaced with the actual packaged KIIR artwork in ICO,
96px PNG and Apple icon formats. All pages have a branded default sharing image;
published articles use their cover image when one exists.

Article search titles/descriptions use editor overrides, then the article title
and summary/body. Published articles are included automatically in the XML
sitemap and RSS. Drafts, archived content and unfinished Urdu translations are
excluded. Supported Urdu pages have reciprocal language alternates. Publication
categories have distinct titles/canonicals and are discoverable in the sitemap.
Paginated archives have their own canonical page URLs. Requests beyond the
last archive page display the not-found view with noindex rather than a service
error. Next.js may have started a streamed HTTP 200 response before discovering
that a page is absent; the explicit noindex keeps that invalid page out of search. Date/type-filtered
variants avoid competing in the index. Structured data retains Article or
ScholarlyArticle information even when the record also has Event classification.
The publisher identity, logo, article identity and breadcrumbs are explicit.

Website settings includes a read-only Search visibility section linking to the
current sitemap and crawler rules. The content editor explains automatic search
metadata and sitemap behavior. Preview deployments and staff pages remain
noindex. The current public canonical origin is `https://kiir-opal.vercel.app`.

## Preserve kiir.org.pk before changing hosting

The original domain is still serving the old site. This release does not change
its DNS or redirect its users to the Vercel hostname. The original site's
ranking and backlinks belong to its existing URLs, not to the temporary Vercel
address. A sitemap helps discovery; it cannot promise indexing or keyword ranks.

The recovered crawl inventory contains 284 page URLs, saved in
[legacy-url-inventory.csv](legacy-url-inventory.csv). It is a previous crawl,
not a complete current Google index or a traffic/ranking report. Current search
results also show `/blogs`, `/Research-Paper`, `/reports` and `/past-events`.
Navigation equivalents are redirected only where there is a meaningful new
section. Unmapped article/program URLs are deliberately not redirected en masse
to the homepage or an unrelated archive.

Before moving the original domain:

1. Export current Search Console/analytics landing URLs and obtain an up-to-date
   old-site sitemap/crawl. Include both www/non-www variants and linked PDFs.
2. Import the approved historical content, retaining its original publication
   dates and media references. Historical import remains excluded from this task.
3. Map each old article URL to the matching new canonical article; preserve
   addresses where feasible and use one-hop permanent redirects for changed URLs.
4. Preserve or recreate existing Search Console verification and analytics. No
   Search Console verification token or property connection has been supplied;
   no sitemap submission or ranking/traffic measurement is claimed.
5. Attach and verify kiir.org.pk and www.kiir.org.pk on Vercel, choose the canonical
   hostname, set NEXT_PUBLIC_SITE_URL to that hostname, and redeploy. Confirm
   canonical, hreflang, sitemap, RSS and structured URLs all use it.
6. Recheck the URL mapping, real 404s, downloads, robots and public indexability
   before routing the domain's traffic. Retain the previous host for rollback.
7. Submit the new canonical sitemap in the existing Search Console property and
   monitor crawl errors, indexed pages, landing traffic and search impressions.

Google's migration guidance:
https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
Google's sitemap guidance:
https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

## Preserve the branded Google search appearance

The owner's search screenshots show grouped sitelinks for About Us, Conflict
Resolution, Political Development, Executive Director and KIIR 2024 Internship
program. Treat these as priority landing pages during the original-domain move.
About Us has a meaningful `/about-us` → `/about` mapping. The recovered inventory
includes `/conflict-resolution` and `/political-development`; verify their exact
content and destinations before cutover. Executive Director and the 2024
internship URLs still require confirmation from the current site/Search Console.
Do not substitute unrelated programs for these pages. Keep any retained 2024
internship accurately dated/archived; publish current opportunities separately.

Keep priority pages crawlable and linked with descriptive navigation, titles and
headings. Google selects sitelinks automatically; their exact layout/order and
the “More results” site-search link cannot be set in the CMS or guaranteed.
Preserve the original domain, meaningful landing pages and URL mappings to
support continuity. Historical migration is still outside the current scope.

Retain the existing Google Business Profile, its reviews and business identity.
Do not create a replacement listing for the new website. Check its website link
and factual contact details at cutover. The map/review panel is managed through
that existing profile, separately from website metadata.

Sources:
https://developers.google.com/search/docs/appearance/sitelinks
https://support.google.com/business/answer/3038177
