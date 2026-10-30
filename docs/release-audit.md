# Release audit, 2026-10-28

What stands between today's build and a full public release, page by page. The short version, with status, is on `/dev/progress` (filter "Blocks launch"). Copy findings are flagged for the client, never reworded here.

## Recheck, 2026-10-30

Every finding below was checked again against `b1ab8fe` (the design-language pass and the new provider and admin dashboards) plus the uncommitted work in the tree.

- **Still open:** every blocker and should-fix item. One is partly done: the blog index now ends with the site footer on phones (`ed274ed`), but computers still have no footer or legal links.
- **Page sweep:** all 70 pages, now including the provider Overview, Analytics and What's new and the admin queue at `/admin/queue`, load at 1280 and 375 for every role, with no page errors and no horizontal scroll. Only the intended 404s are flagged.
- **Checks:** `npm test` 102 passed (14 files); `tsc` 0 errors; lint 0 errors, 13 warnings.
- **Live site:** still on `ed274ed`, because `b1ab8fe` isn't pushed, so the new dashboards aren't live yet. The samples are still in search, `/robots.txt` is still 404, and `app.psychmind.org` still returns Vercel's 404.
- **Banners:** the new profile-banner upload allows 5 MB, but banners are cropped to WebP in the browser first, so they stay under Vercel's 4.5 MB limit. License documents are still the only uploads at risk.
- **Fixed later the same day:**
  - Expired, broken and already-used confirmation links now explain themselves on log in (`/auth/verified`, with a Playwright test).
  - License documents are capped at 4 MB, with the text to match.
  - Every email was redesigned in the landing's look (preview them all at `/dev/emails`).
  - Re-verification (D12): once verified, a new name, title, business name, NPI or license waits for an admin while the public profile keeps the verified details, and a new state stays hidden until its license is verified (`lib/provider/review.ts`).
  - The profile editor lost its cramped side preview; "View profile" opens the full profile in a new tab (`/provider/preview`).

## How it was checked

- **Every page loaded** at 1280 and 375 px: signed out, as a new patient, as a new provider, and as an admin (local test accounts). All 66 views render with no page errors and no horizontal scroll. Role redirects work (a patient opening `/provider` or `/admin` lands on `/account`), and unknown providers, requests and admin ids give a 404.
- **Every route's code was read**: data loading, server actions, role checks, UI states, links, placeholders and `TODO(client)` notes, compared with the contract and the build plan.
- **Checks:** `npm test` 94 passed (13 files); `tsc` 0 errors; lint 0 errors, 13 warnings (12 `no-img-element`).
- **Live site:** www.psychmind.org serves log-in, search (with the samples) and the admin portal at dev.psychmind.org, so production has its database. `app.psychmind.org` points at Vercel but returns Vercel's 404, so the portal runs on www for now. `/dev/*` is hidden. `/robots.txt` is 404.

## Blocks launch

### Build
1. **Provider blog** (contract Milestone 3). There's no table, editor (Figma D3–D5), admin moderation, provider posts on `/blog` or "Articles" section on profiles. The only blog table is `blog_subscriber`.
2. **988 is missing from the auth shell.** `/login`, `/signup`, `/request` steps 1, 2, 4 and 5, its "not taking new clients" view and its confirmation have no crisis access (CLAUDE.md rule). Only request step 3 and the under-18 screen show `CrisisStrip`. `components/auth/auth-shell.tsx:52-63`, `components/requests/request-wizard.tsx:400`
3. **Suspended or rejected providers keep paying and can't cancel.** The billing page checks `!verified` before `hasSubscription`, so they never see Manage billing (`provider/(dashboard)/billing/page.tsx:113-119`). Suspending doesn't touch Stripe (`server/admin/actions.ts:59-79`). The renewal terms promise "Cancel anytime online from Billing → Manage billing" (`lib/billing.ts:118`). This matters as soon as Stripe is on.
4. **Favicon is the create-next-app default** (`src/app/favicon.ico`, 25,931 bytes), with no app icon, Apple icon or manifest.
5. **Operations guide and backups** (contract Milestone 4): keys, payments, webhooks, restoring the database. Neither exists.
6. **Security review, accessibility and performance checks** (contract Milestone 4): not started. The admin and platform findings below are a first pass.
7. **Remove the sample providers**, or load the client's real ones. They're live in search on www.psychmind.org today.

### Client (content and legal; flag, don't reword)
8. **Made-up figures and people on the home page.**
   - "< 24h avg. time to first session" and "4.8 average provider rating" (`home/trust-row.tsx:18-19`); there's no rating system.
   - Placeholder testimonials, two of which praise messaging the provider, which doesn't exist (`home/reviews-data.ts:13,23`). They also show on /how-it-works.
   - Three fictional "verified" providers with stock photos (`home/verified-providers.tsx:26-49`).
   - "Meet 2,400+ verified providers" (`verified-providers.tsx:338`) and "Search thousands…" (D26).
9. **Placeholder blog posts.** 6 of 7 say "This is placeholder content", including a "$850K pre-seed round" announcement and an "AI search tool" story. The Providers tab lists Markdown posts by invented "Dr." authors. `content/blog/*.md`
10. **Legal pages don't match the app.**
    - **Cookie policy:** describes analytics cookies, a consent banner, a "cookie settings" footer link and cookies for search filters. None exist; filters live in the URL. `cookie-policy/page.tsx:35-43`
    - **Privacy policy:** claims "sessions booked, and messages sent" (`privacy-policy/page.tsx:35`); leaves out the in-house analytics, blog and marketing email, and photo-ID uploads for account recovery; says providers get "name and contact details only", but the patient's note goes too; §8 is a placeholder.
    - **Terms:** §6 repeats §5; §3's parent-or-guardian line contradicts the 18+ screen; jurisdiction "still being established" (`terms/page.tsx:94`); nothing on the provider subscription or its automatic renewal.
    - **Contact addresses** on every legal page are `@psychmind.co`; the app sends from and links to `psychmind.org`.
11. **DMCA agent and postal address.** `/copyright` shows only an email until `DMCA_AGENT_*` is set, and marketing email throws until `LEGAL_POSTAL_ADDRESS` is set (`server/marketing.ts:38`). Already tracked.
12. **Final copy review** (D27), plus the How it works FAQ, whose answers are marked placeholder and promise an insurance filter, messaging and a cancellation policy on profiles (`how-it-works/faq-data.ts:21,26,31`).

### Accounts
13. **Stripe:** a test-mode run, the customer-portal cancellation setting, then live mode on the client's account. Already tracked.
14. **`CRON_SECRET` on Vercel production.** Without it the daily job returns 401, so upload cleanup, onboarding reminders and the billing re-check never run (`api/cron/daily/route.ts:22`). Check whether it's set.
15. **Email sending domain** verified in Resend, and **Google sign-in** in production. Already tracked.

## Should fix

### Every portal area
- **No `loading.tsx` or `error.tsx`** under `(auth)`, `/account`, `/provider`, `/admin`, `(reader)` or `(contact)`. A failed query replaces the whole page with `global-error.tsx`, and unknown admin ids show the marketing 404.
- **License uploads over 4.5 MB fail on Vercel.** The UI promises 10 MB (`lib/provider/uploads.ts:6`), but Vercel Functions cap request bodies at 4.5 MB. Upload straight to storage, or lower the limit to 4 MB.

### Auth and requests
- **Expired or used email-confirmation links show nothing.** Better Auth redirects with `?error=TOKEN_EXPIRED` to a page that sends signed-out visitors to `/login`, and `/login` doesn't read it. `server/auth/actions.ts:137`, `(auth)/login/page.tsx:11-29`
- **The request draft is lost on the log-in or sign-up detour.** It lives in tab-only `sessionStorage`, and the confirmation link opens a new tab. `submit()` has no try/catch either, so a network error drops the draft. `request-wizard.tsx:206-270`
- **`/auth/continue?intent=provider` changes state on a GET.** A cross-site link can turn a new patient account (under 10 minutes old) into a provider. `app/auth/continue/route.ts:17-23`

### Patients
- **Saved providers who leave the directory drop off,** and a request's "Profile" link then 404s. Already tracked. `server/directory/data.ts:165`
- **The save heart has no error handling,** so a failure throws to `global-error`. `components/directory/save-button.tsx:112-133`

### Providers
- **Missing banners:** cancellation pending, canceled and "live again". A canceled subscription maps to `unpaid` and reads "Activate your listing" (`lib/billing.ts:70-71`). For rejected or suspended providers, "Getting listed" still shows verification as in progress (`provider/(dashboard)/page.tsx:48-63`).
- **Billing:**
  - there's no "processing" checkout return (`billing/page.tsx:52-57`);
  - with Stripe off, the badge says "Not active" while the dashboard says "Live";
  - the extra-location modal sends providers to Billing, where they can't buy locations (`locations-form.tsx:84-93`).
- **Re-verification (D12):** only license edits trigger review. Name, title and NPI changes don't, and a live provider can add a location in a new state with no license (`server/provider/actions.ts:104-213`).
- **The requests address isn't verified.** A typo sends patients' details and notes to a stranger. `server/requests/actions.ts:128-137`
- **Submitted page:**
  - the "Profile submitted" time is the time of each visit (`submitted/page.tsx:30`);
  - it says you can keep editing, but the editor is locked (`:96`);
  - support is `support@psychmind.org`, while other pages use `hello@psychmind.co` (`:116`).
- **Suspend and unsuspend send no email** (`server/admin/actions.ts:82`).
- **License expiry (D13):** `provider_license.expires_at` is never collected or read.

### Admin
- **License documents need only the admin role.** There's no two-step-login or temporary-password check, unlike the recovery-ID route. `api/files/[id]/route.ts:20-22`
- **Removing someone from `ADMIN_EMAILS` takes effect only at their next sign-in,** up to 14 days later. `requireRole` never re-checks the list. `server/auth/session.ts:50-61`
- **Races:**
  - two admins can decide the same provider at once, and both decisions are emailed (`server/admin/actions.ts:44-68`);
  - completing and declining one recovery request at once can move the account while marking the request declined (`server/account/recovery.ts:174-210`).

### Platform and SEO
- **No `robots.txt`, `sitemap.xml`, Open Graph or Twitter tags, `metadataBase` or canonical URLs.** Shared links have no preview. Portal and auth pages have no `noindex`.
- **Row-level security:** no table has it. If the production database is Supabase with its Data API on, turn RLS on for every table (the app connects as the owner, so it isn't affected) or switch the Data API off.
- **No error monitoring and no CI.**
- **The old `/api/contact` route is dead but live.** It sends from `onboarding@resend.dev`, has no length caps, and names missing env vars in its error. Only the smoke test calls it. Remove it and test the server action instead.
- **Decap CMS** loads from unpkg at a floating `^3.0.0` with no SRI, on a page that receives a GitHub token with `repo` scope. `/cms` is outside the CSP. `public/cms/index.html:12`. This goes away when the blog moves into admin.
- **Social links are `href="#"`** in the footer and on /mission (`shared/social-links.tsx:6-8`). Add the real URLs, or hide them.

### Blog and home
- **Subscribers are never emailed,** but the dialog promises new posts by email. Already tracked.
- **Five post excerpts are "4 min read · Jan 2025".** That text becomes the meta description and the post's first line.
- **The home "Resource center" sorts by month name as text,** so February lands after January (`lib/blog.ts:37`).
- **The blog has no footer or legal links,** and the Subscribe dialog has no privacy link (`(blog)/layout.tsx`, `blog/subscribe-dialog.tsx:66`).
- **The hero music licence is unconfirmed** (`home/showcase.tsx:27`, `TODO(client)`).

## Decide

- **Health details in URLs.** Search keeps the specialty and the free-text "What's on your mind?" in the query string (`lib/search/filters.ts:27-30`), so they reach logs and browser history. CLAUDE.md says no health details in URLs, while the plan asked for shareable filter URLs. Pick one: keep only non-health filters in the URL, or accept it and note it in the privacy policy.
- **`app.psychmind.org`:** add the domain and set `APP_HOST`, or keep the portal on www.
- **Two-step login** can be turned on but not off, and backup codes can't be regenerated.

## Nice to have (build plan, not the contract)

- **Patients:** request statuses beyond new and contacted (D18), withdraw, a request detail page, an "Unavailable" profile page (D15), an "already requested" state, a sticky "Request a session" bar on phones, "Who is this for?" and preferred times (D22), and Undo on unsaving.
- **Providers:** a mobile Edit/Preview toggle in the editor, the changes-requested reason on each field, re-applying after rejection (D11), analytics loading and error states, and CSV export.
- **Admin:** search, paging and status filters on the lists, claim/lock in the queue, links to state licensing boards, a reminder when a submission waits too long, a site-wide audit log, and the custom tags report.
- **Site:** structured data, permanent (308) host redirects, 988 in the footer and on /contact, and the header menu's Browse providers and For providers links.
