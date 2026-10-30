# PsychMind: working notes for Claude Code

PsychMind is a US directory that connects people with licensed mental-health providers. This repo holds the marketing site (live at psychmind.org) and the app being built in vertical slices.

- **The plan:** `docs/build-plan/BUILD-PLAN.md`. Research behind it is in `docs/build-plan/research/`.
- **One slice per session.** Before building, copy the slice into `docs/specs/slice-NN-name.md`.
- **Progress tracker:** `/dev/progress` (local only) shows what's built and what's left per contract milestone (`../contract/contract.html`). Its list is `src/app/dev/progress/tracker.ts`: update it in the same change that starts or ships a feature, and bump `REVIEWED`.

## Commands

```bash
npm run dev          # next dev (Turbopack)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest unit tests (tests/unit)
npm run test:e2e     # playwright, desktop + 375px (tests/e2e); starts next dev on :3100
                     # if a dev server is already running here, Next refuses a second one:
                     # E2E_BASE_URL=http://localhost:3000 npm run test:e2e
npm run build
```

## Git and deploys

- **Vercel deploys `main` to psychmind.org.** Work on a branch and never push to `main` without the owner's go-ahead.
- End commit messages with the attribution lines given in the session's instructions.

## Stack

Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui on Radix, GSAP + Lenis (marketing only), and Resend.

**App:**
- **Auth:** Better Auth 1.7 (`src/server/auth`).
  - Email/password with required verification, password reset, and Google when its keys are set.
  - `role` is `patient`, `provider` or `admin`. Admins come from `ADMIN_EMAILS`; see Admin accounts below.
  - API notes: `docs/build-plan/research/better-auth-stripe-cheatsheet.md`.
- **Database:** Drizzle ORM on Postgres. The schema is in `src/db/schema`; migrations are in `drizzle/`.
  - `npm run db:generate` creates a migration; `npm run db:migrate` applies it to `DATABASE_URL`. On Vercel, `npm run build` applies them first (skipped without `DATABASE_URL`).
  - Without `DATABASE_URL`, local dev uses **PGlite** in memory, snapshotted to `.data/pglite.tar.gz`. Delete that file to reset.
- **Billing:** the Better Auth Stripe plugin, loaded only when `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_PRICE_BASE` are set.
  - Listing and grace rules: `src/lib/billing.ts`.
  - Test-mode setup (product, keys, webhook, local Stripe CLI): `docs/live-testing.md` §C.
- **Email:** `src/server/email.ts` sends through Resend, or writes to the local outbox at `/dev/mail` when `EMAIL_TRANSPORT=outbox` or when there's no key.
- **Email confirmation links** return through `/auth/verified?next=…` (the `callbackURL` in `server/auth/actions.ts`). It carries on when the link signed them in; otherwise it opens log in with what happened: expired (`?link=expired`), broken (`?link=invalid`), or already confirmed (`?verified=1`).
- **Uploads:** `/api/uploads` and `/api/files/[id]` check ownership and sniff file bytes. Bytes live in `.data/uploads` locally and in the private `file_blob` table on Vercel (`STORAGE_DRIVER`). Supabase Storage replaces that at scale.
- **Forms:** react-hook-form with Zod 4. Use our `zodResolver` in `src/lib/forms`, not `@hookform/resolvers`. Provider sections are shared by the wizard and the editor.
- **Rate limits:** `rateLimit()` uses Upstash when configured, else the `rate_limit_counter` table in Postgres (production), else memory (local). Keys are hashed. Better Auth's own limiter uses the same store (`customStorage`), but it does **not** rate-limit server-side `auth.api` calls, so wrap actions yourself. Sign-in is also limited per account, whatever the IP.
- **Two-step login:** the Better Auth `twoFactor` plugin (authenticator app + 10 backup codes). **Required for admins**: `requireRole("admin")` sends them to `/two-factor/setup`, and admins can't sign in with Google. Any user can turn it on in Settings.
- **Admin accounts** (`server/admin/accounts.ts`): made for people, never signed up for.
  - Every `ADMIN_EMAILS` address without an account gets one, with a temporary password by email (valid 3 days), when `/admin/login` or Admin → Admins is next opened. Signing up with a listed address creates nothing and answers like any sign-up.
  - The team logs in at `/admin/login` (signed-out `/admin` visits go there). With `ADMIN_HOST` set (production: `dev.psychmind.org`), the console lives on that host with `/login` as its front door, `/admin` anywhere else moves there, and an admin's right password on the regular log-in is undone and pointed there (`server/auth/actions.ts`). `requireRole("admin")` then requires, in order: a new password (12+ characters, with their name) at `/admin/password`, then two-step login.
  - An expired temporary password is refused at sign-in (only someone who knows it is told). A password reset replaces it too.
  - Admin → Admins lists everyone and their setup state; "Reset access" emails a new temporary password and clears their authenticator and sessions. Everything is audit-logged.
- **Test provider (local only):** logging in as `provider@psychmind.test` with the e2e `TEST_PASSWORD` deletes and recreates that account, then opens a fresh onboarding welcome (`server/auth/test-provider.ts`, hooked into `signIn`). It's off in production builds.
- **Demo provider (local only):** logging in as `demo-provider@psychmind.test` with the e2e `TEST_PASSWORD` rebuilds Maya Ellison: an approved, listed profile with four months of analytics, search terms and 14 session requests (4 new), so the dashboard can be checked without empty states (`server/auth/demo-provider.ts`, hooked into `signIn`). Off in production builds.
- **Account data:** Settings → "Download your data" (`/api/account/export`, no secrets) and "Delete your account" (password required when the account has one; `server/account/cleanup.ts` cancels billing and deletes files first).
- **Login settings** (Settings → Login, every role; `components/app/login-settings.tsx`, `server/account/settings-actions.ts`):
  - **Change email** takes two proofs (`server/account/email-change.ts`): a link to the current inbox, or the authenticator app (plus password) when that inbox is gone, opens `/change-email`; then a link to the new address opens `/change-email/confirm`, where a button (not the link, so mail scanners can't spend it) makes the change. The old address is told, and Stripe's customer email follows. Links are one-time hashed tokens in `verification` (`server/account/tokens.ts`), 30 minutes. Admins can only move to another `ADMIN_EMAILS` address, and nobody else can take one.
  - **Password:** change it (other sessions end, and an email says so), or add one to a Google-only account. Admins need 12+ characters.
- **Account recovery** (`/account-recovery`, `/api/account-recovery`, `server/account/recovery.ts`, Admin → Account recovery): for someone with no inbox and no authenticator. A request carries a new contact email, and a photo ID (required for providers). It answers the same whether or not an account matched, is rate-limited per IP and per account email, and alerts the account's current inbox. An admin compares the ID with the account (each ID view is audited), then moves the account (signs it out everywhere, optionally clears two-step login, emails a 24-hour link to choose a password) or declines with a note. The ID is deleted when the request closes. Admin accounts are recovered with Reset access instead.
- **Email notifications** (Settings, every role; `lib/notifications.ts`, `server/notifications.ts`, the `notification_opt_out` table): optional emails are on until turned off. Senders of optional email check `optedOutOf()` / `wantsEmail()` first and pass `settingsUrl` to `layout()` (a "Choose which emails you get" link). "News and tips" is the marketing opt-out in `email_preference`, shared with unsubscribe links. Account, security, billing and verification emails are always sent.
- **Daily job** (`/api/cron/daily`, `vercel.json`, needs `CRON_SECRET`): deletes uploads no profile uses after a day, sends onboarding reminders (1, 3, 7 days), re-checks billing (missed webhooks, "profile paused"), and runs `maintainAnalytics()`. Emails that must go out once use `server/once.ts` (an `audit_log` row per key).
- **Billing emails** (`server/billing/notices.ts`, pure rules in `lib/billing-notices.ts`): payment failed, profile paused, payment recovered, cancellation confirmed.
- **CSP:** set in `proxy.ts` (`lib/csp.ts`). Portal pages get a per-request nonce with `'strict-dynamic'`; marketing pages allow `'self' 'unsafe-inline'` scripts. A new third-party script, image host or form target must be added there.
- **Directory** (`src/server/directory`, `components/directory`, `components/search`, route group `(directory)`):
  - **Search** (`/providers`, Figma S1/S5/S6): the search bar on top, the filters on the left, and the results; on phones, a "Search filters" drawer that applies on Save.
    - **One search bar.** The results bar and the home page's are built from the same parts (`components/search/bar.tsx`: frame, segments, panel, `FormatSwitch`, search button, phone `SearchPill`; looks in `home/search-styles.ts`). Session format holds "Where?" in its panel, as the home bar holds the ZIP. Change the bar there, never in one page only.
    - The engine is pure (`lib/search/engine.ts`, unit-tested): listed providers plus filters in, ranked results, per-option counts and "close matches" out. It runs on the server for every request.
    - Within a filter, values are OR; across filters, AND. Location is never relaxed: in-person means a practice near the place (same ZIP, city, ZIP area, then state; there's no geocoding yet), and online means a license in the patient's state.
    - Filters live in the URL through nuqs (`lib/search/filters.ts`, `components/search/use-search.ts`).
    - There's always a session format: Online unless in-person is chosen (the parser's default, written into links). Clear all keeps it. The engine can still search either format (`EngineFilters`), for its unit tests only.
    - No card around the page: the bar, the filters column and the results sit on the landing's near-white page. The filters column and each result card are the landing privacy promise's layers (`frame`, `frameCard`, `frameColumn`). Card tags (place, specialties, languages) and chosen filters are the bar's pill (`pill`). The filters scroll in our `ScrollArea`, not the browser's scrollbar.
  - A result opens a **quick look** over the page, with the background blurred (`?p=`; Back closes it on phones).
  - A full profile opens in a new tab at `/providers/{name-slug}-{publicId}` (`lib/provider/links.ts`). Only the 8-character `public_id` is looked up; a stale name redirects to the current one.
  - **Listed** = approved and, once Stripe is configured, paying or in the 3-day grace period (`listedCondition()`). The public projection never includes email or NPI, and street addresses only for in-person locations. It shows only verified licenses, and a location only in a state with a verified license (a new state waits for its license).
  - **Saving** (`saved_provider`) is for patients. Signed out, the heart asks them to sign up or log in and brings them back with `?save=1`, which saves on arrival. Redirect targets go through `lib/safe-next.ts`.
  - **Sample providers:** 50 realistic profiles (`sample-data.ts`). They're flagged `is_sample`, labelled in the quick look and on the full profile (no banner over the results, the owner's call on 2026-10-29), never emailed (requests to them are a demo), `noindex`, use Unsplash photos, and always rank after real providers.
    - Migration 0007 seeds them into any new database, generated by `scripts/sample-seed-sql.ts`; it stays out once they've been removed.
    - Admin → All providers adds or removes them. Both paths share `sample-rows.ts`, so they create identical profiles.

- **Session requests** (`/request/{name}-{publicId}`, Figma B1–B7, in the auth shell):
  - Five steps: confirm, session type and format (only what the provider offers), an optional note, then log in, sign up or continue as guest, then review.
  - It's saved to `session_request` and emailed to the provider's requests address (`provider_profile.request_email`, else the account email) with Reply-To set to the patient. The patient gets a confirmation.
  - The same email to the same provider within a day isn't sent twice. Requests are rate-limited per IP and per email, and have a honeypot field.
  - Patients see theirs under "My requests" (`/account`). Providers see theirs at `/provider/requests` and can mark them contacted. Providers reply outside the app.
  - Requests to sample providers are a demo: saved, never emailed.

- **Analytics** (in-house; `lib/analytics`, `server/analytics`, `/api/events`, `components/analytics`):
  - Pages report counts in batches with `sendBeacon` (`lib/analytics/client.ts`): page views, searches, impressions (a result card at least half on screen for 0.6 s), quick looks and full profile views. Saves are counted on the server; session requests come from `session_request`.
  - Only daily totals are stored (`analytics_daily`, per provider or `""` for the whole site). Days are New York days (`lib/analytics/range.ts`).
  - Search terms are rebuilt on the server from known filter values ("Anxiety · Online · Florida"), never from typed text. Providers see a term once it reaches 5 uses (D24).
  - Unique visitors: a hash of IP and browser with a salt that changes daily. `maintainAnalytics()` turns each finished day into a plain count and deletes the hashes. Browsers that send DNT or GPC aren't counted. No cookies.
  - `/api/events` drops bots and other sites' pages, is rate-limited per IP, caps each provider's counts per batch, and ignores a provider viewing their own profile.
  - Dashboards: the provider's at `/provider/analytics` (Figma D1) and the team's at `/admin` (the console's home; `/admin/analytics` redirects there). One date filter scopes everything below it, with deltas against the same number of days just before. Charts are shadcn Chart (Recharts) in `--chart-1`, with a table view.
  - Deleting a provider (or the samples) deletes their analytics (`forgetProviderAnalytics`).

**Planned:** Supabase for Postgres and Storage.

**Every env var** is documented in `.env.local.example`.

## Hosts

- **The portal** is `app.psychmind.org`; marketing stays on `www`. The directory (`/providers`) lives on the portal host too, because the session cookie is host-only and saving needs it.
- `src/proxy.ts` and `src/lib/hosts.ts` route each request to the right host. The admin portal is a third host when `ADMIN_HOST` is set (production `dev.psychmind.org`; locally try `dev.localhost`); `appUrl()` sends `/admin` links there.
- **Locally**, open the portal at `http://app.localhost:<port>`. `APP_HOST=off` serves it from `localhost` instead, which Google sign-in needs.
- **Vercel previews** serve everything from one host and use the branch URL as the auth origin (`defaultOrigin()`).
- **`/dev/setup`** shows what a deployment has configured and the exact Google redirect URI. The guide is `docs/live-testing.md`.
- **Portal UI** uses the `.app-ui` scope from `globals.css` (the auth shell, onboarding and `AppShell`, so every dashboard):
  - the public site's Inter (since 2026-10-29), `type-ui-*` roles and product-sized controls; dashboard numbers (`type-ui-figure`, `type-ui-hero-figure`: stat tiles, the billing price) are Geist Mono through `--font-figure`;
  - the public site's corner rule, about a third of the height (the hero's 48px search button / 16px): 40px fields at 12px, buttons per size (12–16px) via `--radius-button`, set in `globals.css`;
  - segmented controls (date range, chart/table, `Tabs`, Online / In-person) all use ToggleGroup's `segment` variant, the search bar's two-way toggle;
  - `animate-ui-enter` for content as it enters.
- **Auth pages** share a persistent animated panel (`components/auth/portal-panel.tsx`).
- **Provider forms** (wizard and editor share them): a failed save shows `FormErrorSummary` at the top (lines read from the inline errors; collapsed cards use `data-card-index` / `data-error-scope` / `data-card-error` and `useCardReveal`). Leaving with unsaved changes asks first (`UnsavedChangesGuard` in `SectionFooter`: links, Back via `back-guard.tsx` booted in the root layout, and closing the tab), with Save and leave. The practice ZIP fills an empty city and state via `/api/zip/[zip]` (Zippopotam.us, server-side, 2.5 s timeout); the fields always stay typeable.
- **Changes after verification** (`lib/provider/review.ts`, owner's rules, 2026-10-30): once approved, a new name, title, business name or NPI is held in `provider_profile.pending_changes` and an edit to a verified license in `provider_license.pending`; a new license (new state) is a `pending` row. The public projection keeps reading the verified columns; `loadProviderState` shows the provider (and the admin review) the requested values plus `inReview`. Everything else saves live. `needsReview` is recomputed after every save (`refreshReview`). Admins approve (applies everything, new licenses verified) or decline with a note (pending dropped, new licenses `rejected`, note on the dashboard banner); both email the provider. The upload cleanup keeps documents referenced by `pending`.
- **Profile editor** (`/provider/profile`): the section list and the form, no preview beside them; "View profile" opens `/provider/preview` in a new tab, the profile at full size in the directory's layout (`DirectoryChrome`), whatever the status, with the latest saved edits.
- **Profile photos** are cropped before upload (`components/provider/photo-crop-dialog.tsx`, react-easy-crop), and Save waits while any file is uploading.
- **Onboarding** has its own shell (`components/onboarding`): step rail, save status, and a step-by-step live preview (`step-preview.tsx`). Each step shows its part of the profile at real size, in a browser window that wraps it on the gray paper panel. "Full profile" opens the whole page. Below `xl` the top bar shows the current phase and step instead of all phases.

## Route groups

| Group | Purpose |
|---|---|
| `(site)` | Marketing |
| `(auth)` | Login and sign-up |
| `(directory)` | `/providers`: results and public profiles (marketing chrome, account menu when signed in) |
| `(patient)` | `/account` |
| `(provider)` | `/provider`: Overview (account health from `lib/provider/health.ts`, the last 7 days), Requests, Analytics, Profile, Billing, Settings and What's new (`lib/changelog.ts`, edited by the team) |
| `admin/(console)` | `/admin`: the admin console (DashboardShell; `requireRole("admin")`). Home is Analytics; the verification queue is `/admin/queue` (its count in the sidebar), then Account recovery, All providers, Admins and Settings |
| `admin/(entry)` | `/admin/login` and `/admin/password` (first log-in), in the auth shell |

The Decap CMS for company blog posts lives at `/cms` (`public/cms`). `/admin` is reserved for the admin dashboard.

## UI rules

- **Use shadcn components** (`npx shadcn@latest add <name>` into `src/components/ui`), themed by the tokens in `src/app/globals.css`.
  - Write a custom component only when the design needs something shadcn can't express.
  - Never hand-roll a button, input or dialog.
- **The landing page is the style reference.** Use only:
  - the `@theme` tokens (warm palette, `brand-primary`, radii `tag`, `field`, `card`, `panel`, `pill`, and the `shadow-control`, `shadow-card` and `shadow-raised` shadows);
  - the `type-*` roles for text (`type-display`, `type-h2`…`type-h4`, `type-title`, `type-body`, `type-small`, `type-caption`, `type-overline`);
  - `surface-soft` and `grain` surfaces;
  - `SectionBadge`, `Tag`/`VerifiedBadge`, the doodles, and `CrisisCard`.

  No new colours, fonts or one-off pixel values. Note that `cn()` drops `text-display-*` classes; use the `type-*` utilities instead.
- **`Button`** (`src/components/ui/button.tsx`) has PsychMind variants:
  - `primary`: ink, the default.
  - `brand`: crimson, for the single most important action.
  - `secondary`, `ghost`, `inverse`, `outline-light`.
  - shadcn aliases: `default`, `outline`, `destructive`, `link`.
  - Sizes: `sm`, `md`, `lg`, `icon`, `icon-sm`.
- **Motion:** in the app, use CSS transitions, `Reveal` and skeletons. GSAP is only for celebratory moments. Lenis is off on app routes. Always respect reduced motion.
- **Every screen ships every state:** loading, empty, error (field, action and page), success, unauthorized, not found. Test at 375px.
- **App building blocks** live in `src/components/app/`:
  - `AppShell`: header with nav, avatar menu, mobile sheet and slim footer. The patient area keeps it (a calm top nav).
  - `DashboardShell`: the provider dashboard and admin console, after Untitled UI (Jordan Hughes) and Interfere. Full screen (no inset window): the sidebar is the same white as the page, set apart only by the top bar's hairline (`border-warm-900/[0.06]`); the current page is a soft grey fill; counts are plain grey figures on a faint tile (no filled circles). The logo stands alone with the area as a pill (`area`: "Admin console", "Provider"). The sidebar folds to a 60px icon rail (top-bar toggle or ⌘/Ctrl B, remembered in the `pm_sidebar` cookie from `lib/dashboard.ts`, so the layout renders it folded); a top bar names the page; the page scrolls inside. Icons are passed by name; count badges; What's new as a card with an unread dot; the account row. The layout's `banner` (StatusBanner) shows under each `PageHeader` (`DashboardBannerSlot`). Below lg the sidebar opens in a sheet. `preview` fills a fixed box (`/dev/ui`).
  - `StatusBanner`: a neutral white card with an icon tile; the tone only colours the icon and countdown (no coloured bands).
  - `PageHeader`: breadcrumb, title, description.
  - `StatusBanner`: account states with an optional countdown.
  - `EmptyState` (the privacy promise's layers around grey rows of UI, an icon in the first; no doodles) and `ErrorState`.
  - `StatTile`, `StepProgress`, `ChoiceChips` (ToggleGroup `chip` variant), `UploadDropzone`.
  - `CrisisStrip`: compact 988.
- **Icons:** Hugeicons Stroke Rounded (free) through `@/components/ui/hugeicons`, which exports them under the Lucide names the code uses (`CheckIcon`, `XIcon`…). Add a missing icon there; ESLint blocks `lucide-react` (shadcn adds still write it, so swap the import). Calls to action end in `CtaArrowIcon` (Hugeicons' plain arrow right, which nudges forward on hover). The site's own drawn icons (search, phone, send…) stay in `ui/icons.tsx`.
- **Keyboard shortcuts** use `Kbd` (`components/ui/kbd.tsx`): a real keycap, a white face on a grey base. `<Kbd meta>↵</Kbd>` shows ⌘ on Apple devices and Ctrl elsewhere; `arrow="left"` draws a soft triangle (never a ← glyph); `press="ArrowLeft"` sinks the face while that key is held.
- **Weights:** Inter everywhere, and nothing heavier than medium (500): titles, names, buttons, badges and dashboard figures included. No `font-semibold` / `font-bold` (Inter reads heavy at 600). Emails too (400 and 500).
- **One chip shape:** `Tag`, `VerifiedBadge`, card tags and chosen filters are all the bar's pill (`pill` in `home/search-styles.ts`).
- **Verified seal:** every provider's name is followed by `VerifiedMark` (`VerifiedSealIcon`, blue-600), outside the name's heading so the heading stays the name.
- **Emails** (`server/emails.ts`) share one `layout()` in the landing page's look (since 2026-10-30): stone paper, the serif headline (STIX Two Text, then Georgia; no web fonts are loaded), the privacy promise's layers (grey frame, white card, grey column for detail rows), an ink button with the site's 12px corners and arrow, then the site footer's sign-off (Ready to find help?, links, a grey 988 card, copyright) over the footer's boat at sea (`footer-sea.png`, a still of `FooterScene` with its edges faded into the paper). Images are PNGs in `public/images/email`, since Gmail doesn't show SVG; keep `footer-illustration.png`, which emails sent before then still load. No tracking pixels. `/dev/emails` renders every email with sample data (desktop and phone widths); add new templates there.
- **Status colours** use Tailwind's sky (info), emerald (success), amber (warning) and red (danger), always paired with an icon or text. `Badge` has matching variants: `neutral`, `info`, `success`, `warning`, `danger`, `brand`.
- **Statuses in tables and headers** use `StatusPill` (`components/app/status-pill.tsx`): a neutral grey pill, the state told by a small dot (amber waiting, green done, red refused, sky in progress, grey idle; `dot={false}` for plain tags like "Sample"). Tables sit straight on the page (no card; `-mx-3` aligns the first column with the title), rows hover soft grey. Metric tiles group under `MetricGroup` (no card); charts and lists keep `Panel`.
- **Gray scale:** the `warm-*` and `text-*` tokens are runtime variables.
  - Tailwind **stone** everywhere, the portal included (it was zinc until 2026-10-29).
  - Keep using `warm-*` classes.
  - **Layers and opacity** (the landing's privacy promise): a grey frame, a white card 7px in, grey columns 7px in again, corners 20 / 13 / 6 (`frame`, `frameCard`, `frameColumn` in `home/search-styles.ts`). Write greys as ink at an opacity wherever you can: `text-warm-900/60` for secondary text (`/70` on grey), `border-warm-900/10`, `bg-warm-900/[0.04]`.
  - The portal accent is Tailwind blue-600 (`--ring-accent`); crimson is for marketing calls to action, and in the app only for "Request a session" (like the landing search button, Airbnb-style: rare, so it stays loud). Everything else stays neutral.
- **Profile banners:** every account has the default, the landing page's sea in gray (`public/images/profile/default-banner.webp`). A provider can upload their own (`provider_profile.banner_id`, cropped to 4:1) and pick between the two from small squares (`BannerPicker`); `use_default_banner` keeps their upload while the default shows. `banner_style` is a leftover column, unused.
- **Never add named spacing tokens** (`--spacing-lg` etc.) to `@theme`. They shadow Tailwind's named sizes, so shadcn's `max-w-lg` once rendered dialogs 12px wide.
- New primitives must appear on `/dev/ui` (the kitchen sink; hidden in production).

## Content

- **Copy is client-approved.** Never reword existing copy or Figma copy.
- New microcopy gets a `TODO(client)` comment and is listed in the PR.
- Flag copy problems instead of fixing them.

## Privacy and security

- **Health context: keep sensitive data out.** No health details, message text or patient names in emails, URLs, logs, Sentry or analytics. No ad pixels in the app.
  - **One owner-approved exception (2026-10-09):** a session request is emailed to the provider's requests address with the patient's name, contact details and optional note, so their office can reply directly. Subjects stay generic, and the patient's copy never includes the note.
- **Auth checks in layers:** RLS on every table, plus a role check in the server-only data access layer. The service-role key is used only in webhooks and cron.
- **Rate limits:** every write a stranger can trigger is rate-limited (`rateLimit()`).
- **Data layer checks its own role.** Admin data functions call `requireRole("admin")` themselves; a layout's check alone isn't enough (Next can skip layouts on client navigation).
- **Crisis access:** every patient-facing app screen offers 988.
- **Legal safeguards** (`docs/legal/README.md`, guarded by `tests/unit/legal-safeguards.test.ts`):
  - every account passes the 18+ age screen, including Google sign-up and the raw endpoint;
  - visitors' browsers contact no other host (fonts via `next/font`, other images via `selfHosted()`, CSP enforces it);
  - no session replay or third-party analytics;
  - marketing email only through `server/marketing.ts` (postal address, unsubscribe);
  - automatic renewal terms beside every subscribe button (`renewalTerms`);
  - DMCA agent on `/copyright`.

## Files and encoding

- Files use CRLF line endings. Write UTF-8 and never round-trip files through tools that default to cp1252: Windows Python `open()` without `encoding="utf-8"` once corrupted `—`.
- Prefer the Edit/Write tools, or Node with `utf8`, for scripted edits.
