# CMS authentication: implementation and operations

## Delivered in the first implementation stage

- `/admin/login`: custom email/password sign-in; no email confirmation step for provisioned staff.
- `/admin/account`: mandatory first-use password change and later password changes.
- `/admin`: protected staff overview.
- `/admin/users`: Admin-only confirmed account creation, role changes, enable/disable, and temporary-password reset.
- `/admin/audit`: Admin-only latest 100 access events, displayed in Asia/Karachi time.
- Current database membership checks on every staff operation; RLS prevents ordinary authenticated users from granting themselves access.
- Persistent login rate limits, redirect validation, uncached staff responses, and last-enabled-Admin safeguards.
- Separate public/admin layouts with public URLs retained.

Later stages now provide content, publication templates, programs, managed media, settings and announcements. See [the release guide](CMS-SETTINGS-SEO-RELEASE.md) for the current system.

## First account

`admin@kiir.com` was provisioned in the Supabase project identified by the existing environment. Its temporary password is in the local Git-ignored `.cms-credentials-first-admin.txt`, created with permissions `0600`. Sign in and choose a replacement password before accessing administrative screens. Delete the temporary credentials file after changing the password.

For a fresh installation with no memberships:

```sh
npm run cms:create-admin -- admin@example.org
```

The bootstrap command refuses to overwrite existing staff access or reset an existing account. Once an Admin exists, add staff through the CMS. No confirmation/invitation email is sent by provisioning.

## Supabase configuration

The project configured in `.env` is different from the project exposed by the currently connected Supabase plugin. Always verify the project reference before running maintenance.

Staff Auth accepts `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, or the existing server aliases `SUPABASE_PROJECT_URL` / `SUPABASE_PUBLISHABLE_KEY`. Administrative operations additionally require the server-only `SUPABASE_SECRET_KEY`. Public CMS data uses the same configured Supabase project.

The two CMS migrations were applied and recorded in remote migration history:

1. `20261024215145_cms_auth_rbac.sql`
2. `20261024220748_cms_auth_privilege_hardening.sql`

The older public-site migrations and demonstration seed have **not** been applied to this previously empty project. A future content migration must account for that baseline; do not assume public tables already exist or push demo content into production blindly.

The hosted Auth signup flag remains enabled, but the staff-only account guard
blocks every unapproved Auth insertion. A service-only issuer authorizes a
one-use UUID/email pair, and the Auth Admin API creates that identity. Public
signup ignores submitted UUIDs and cannot use the authorization. Provisioned staff
are explicitly confirmed; no confirmation email is required. Use CMS provisioning
or the supplied helper: raw dashboard/Admin API creation without authorization
is deliberately rejected. Existing accounts are preserved.

## Database maintenance

For IPv4-only development networks, set the supplied session-pooler URL without a password in the Git-ignored `.env.local`:

```text
SUPABASE_DB_POOLER_URL=postgresql://postgres.PROJECT_REF@POOLER_HOST:5432/postgres
```

The database password remains in `SUPABASE_DATABASE_PASSWORD`. Maintenance scripts pass it to `psql` through the subprocess environment and do not print it.

```sh
npm run cms:db                           # read-only table inventory
npm run cms:db -- path/to/reviewed.sql    # execute reviewed SQL, stop on errors
```

For future releases, use the Supabase CLI migration workflow and inspect its supported flags. Do not reapply already-applied creation migrations. Keep remote history synchronized if applying SQL directly during initial setup.

## Verification

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:cms:integration
npm run cms:db -- supabase/tests/cms_last_admin.sql
```

Live integration tests create and delete disposable confirmed Auth accounts in the configured project. They check anonymous/nonstaff access, Content Manager isolation, role escalation prevention, service-only RPC access, current-role enforcement after demotion/disablement, and persistent login limits. Run the last-Admin SQL check **after** those accounts are cleaned up; it expects exactly one enabled Admin and rolls every attempted mutation back.

`cms_memberships.must_change_password` blocks editorial/admin permissions until the password-change action successfully updates Auth and clears the flag through a service-only RPC. Resetting a password sets the restriction before updating Auth, so a partial failure leaves the account restricted. Disabled accounts retain an Auth identity but immediately lose all CMS access; re-enable them through another Admin.

Verified on 25 October 2026: 3 unit tests, 14 live Auth/RLS checks, 3 transaction-rolled-back last-Admin checks, lint, TypeScript, and production build passed. Browser checks covered sign-in, mandatory first-password-change routing, the activated Admin dashboard, staff management, audit display, and logout. Anonymous HTTP checks confirmed redirects, private/no-store/no-index staff responses, and public homepage/program SSR. All disposable test accounts were removed; the actual first Admin remains restricted until its owner changes the temporary password.

The first stage upgraded Next.js and eslint-config-next to 16.4.3, pinned the existing Supabase package versions, and applied compatible transitive security patches. The resulting dependency audit reported zero known vulnerabilities at verification time. Use Node.js 24.x.

## Release status

The database and accounts are configured remotely. A Node.js 24 Vercel preview
has been built; the production release uses the existing `kiir-opal.vercel.app` alias. See the
[release guide](CMS-SETTINGS-SEO-RELEASE.md) for the preview and runtime variables.
Never expose server secrets under `NEXT_PUBLIC_*`.
