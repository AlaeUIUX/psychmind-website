# PsychMind web app MVP: architecture and build plan

Prepared 2026-10-07 by the architecture research pass. Read-only research: no project files were changed.
Target: extend the existing marketing site at `website/` (Next.js 16.2 App Router) into the full product, deployed on Vercel from `main`.

Version numbers marked "npm, 2026-10-07" were read from the npm registry on that date. Other version-sensitive claims have a source in [section 13](#13-sources).

---

## 0. TL;DR

**One recommendation:** keep the single Next.js app. Add these services:

- **Supabase** (Postgres 15+ with PostGIS, Auth, Storage, Cron, Queues, Branching) as the backend.
- **Stripe Billing** (Checkout + Customer Portal + webhooks) for provider subscriptions.
- **Resend + React Email** for email. Supabase Auth also sends through Resend SMTP.
- **Upstash** for rate limiting.
- **Sentry** for errors.
- **Vercel Web Analytics** (cookieless) on marketing pages only, plus first-party provider analytics stored in Postgres.

**Why this stack wins on the criteria you gave:**

1. **Speed with Claude Code.** One vendor covers the database, auth, file storage, cron jobs, geo search and per-PR preview databases. Supabase's Next.js SSR guide already targets `proxy.ts`. Claude Code knows supabase-js, SQL and RLS well. Generated types keep it honest.
2. **Security.** There are three layers:
   - `proxy.ts` refreshes the session and does optimistic redirects.
   - A `server-only` Data Access Layer checks the role on every read and action.
   - Postgres RLS acts as defense in depth, so a missed check in app code still can't leak data.

   Admin actions also run under RLS with the admin's own JWT, so every action has an attributable actor in the audit log. The service key is used only by webhooks and cron.
3. **Low ops and low cost.** Roughly $70 to $110 a month at MVP scale (see [section 11](#11-cost-at-mvp-scale-monthly-verify-before-budgeting)). No servers, no Redis cluster, no separate auth vendor.
4. **Easy path to scale.** 100 to 500 providers is tiny for Postgres. The same schema handles 50k+ providers with the indexes below.
5. **A clear upgrade path if counsel decides HIPAA applies.** Supabase Team plus the HIPAA add-on, and Vercel's Pro BAA, both exist. No re-platforming is needed.

**Build order:** 14 vertical slices, each one Claude Code session (details in [section 8](#8-build-order-vertical-slices-one-claude-code-session-each)):

| # | Slice | # | Slice |
|---|---|---|---|
| 0 | Foundations, hygiene, security fixes | 7 | Profile editor (live preview) and public profile |
| 1 | App design-system primitives and shells | 8a | Search engine (SQL, PostGIS, relaxed matching) |
| 2 | Schema v1, RLS, roles, seed, pgTAP | 8b | Search UI (nuqs filters, mobile sheet, hero wiring) |
| 3 | Auth (password, magic link, verify, reset) | 9 | Patient saves and patient dashboard |
| 4 | Provider onboarding wizard and license upload | 10 | Session requests (form, inbox, statuses, emails) |
| 5 | Admin verification queue | 11 | Provider analytics |
| 6 | Stripe billing, grace period, listing visibility | 12 | Provider blog posts (Tiptap) |
| | | 13 | Hardening, accessibility and performance pass, launch checklist |

**Decisions the client must make before Slice 6 or 10** (details in [section 12](#12-open-questions-for-the-client)):

- HIPAA/BAA stance (needs counsel).
- Trial and pricing.
- Whether to charge before or after verification.
- Feature promises in the approved copy that are outside the brief: "message before request", an insurance filter, "Continue with Google", and "thousands of" providers.

---

## 1. What exists today (audit of `website/`)

| Area | Finding |
|---|---|
| Framework | `next` 16.2.12 (pinned), `react` 19.2.4, Turbopack. npm latest is 16.4.0 (2026-10-07). Node 24 locally. Next 16 needs Node 20.9 or later. |
| Styling | Tailwind v4. `globals.css` holds `@theme inline` tokens: brand and warm palettes, text roles, spacing, radii (`tag/field/card/panel/pill`), shadows (`control/card/raised`), easing, `@utility type-*` roles and `surface-soft`. shadcn primitive tokens are mapped onto the palette. |
| UI kit | `src/components/ui/` contains `button` (cva, on-token, good), `field` (shadcn Field family), `input`, `label`, `separator`, `card`, `tag`, `section`, `section-header`, `page-hero`, `icons`, `doodles`. `components.json` uses shadcn "new-york", RSC, the `radix-ui` monorepo package (1.6.7; latest 1.7.0), and a lucide icon alias. Class merging uses the `cn` package (shadcn's compiled clsx + tailwind-merge). |
| Motion | GSAP plugins are registered once in `src/lib/gsap.ts`. Lenis `SmoothScroll` is mounted only in `(site)/layout.tsx`, which is good: app shells must not inherit it. Reveal CSS and reduced-motion handling are global. |
| Routes | `(site)` covers home, blog, `blog/[slug]`, contact, how-it-works, mission and legal pages. `/login` sits outside the group. |
| `/login` | **A visual mock only.** `onSubmit={e => e.preventDefault()}`. It has a "Continue with Google" button with no handler and links to `/forgot-password` and `/signup`, neither of which exists. |
| Dead links | `/providers` (6 references), `/signup` (4), `/signup?role=provider`, `/forgot-password`. The app work will create these real routes. Don't change the link copy. |
| `src/app/api` | `auth` and `callback` run the GitHub OAuth popup for **Decap CMS** (`public/admin`, served by the `next.config.ts` rewrite `/admin -> /admin/index.html`). `contact` takes a POST and sends email through Resend. |
| Blog | Markdown in `content/blog`, read with gray-matter at build time. Decap commits to the GitHub repo `AlaeUIUX/psychmind-website`. |
| Repo state | Branches are `main` and `design-system-refresh`. **The working tree has uncommitted changes** (globals.css, blog files, footer, doodles, and three new blog components). Commit or stash them before Slice 0. There is no CI config, no tests and no `CLAUDE.md` in `website/`. |

### Issues to fix early (Slice 0)

- **S1. Security: the Decap OAuth callback leaks tokens.**
  - What happens: `api/callback/route.ts` posts `"authorizing:github"` to `"*"`. It then sends the GitHub access token (scope `repo,user`) to whatever origin replies, with no `e.origin` check and no OAuth `state` parameter.
  - Why it matters: a malicious page that opens `/api/auth` in a popup could receive a repo-write token for a logged-in maintainer.
  - Fix: allowlist the site origin and add a `state` cookie. Alternatively, retire Decap after company posts move into the database (Slice 12/13).
- **S2. Route collision: `/admin`.** The Decap rewrite claims `/admin`, but the product needs an admin area. Move Decap to `/cms` (update the rewrite and `public/cms/config.yml` paths), or retire it.
- **S3. Abuse: `/api/contact`.** It has no rate limit or bot protection, and it sends from `onboarding@resend.dev`. Add an Upstash limit and a honeypot field. Verify a sending domain in Resend.
- **S4. Design-system drift.**
  - `ui/input.tsx` (`h-9 rounded-md`) and `ui/card.tsx` (`rounded-xl shadow-sm`) are stock shadcn and don't use the tokens.
  - The on-brand input style lives inline in `contact/contact-form.tsx`: `rounded-field border-warm-300/80 shadow-control` plus a brand focus halo.
  - Promote that style into `ui/input.tsx`, and move `Card` onto `rounded-card shadow-card border-warm-200`.
  - Only the login form consumes these today, so the blast radius is small. Still, check the login page visually.
- **S5. Copy versus scope.** Several approved-copy promises fall outside the MVP brief:
  - "Message before request — no commitment until you're ready" (`how-it-works/profile-showcase.tsx`)
  - "Use the insurance filter" (FAQ)
  - "Continue with Google" (login)
  - "Search thousands of verified psychologists" (mobile hero)

  Per the standing rule that copy is client-approved, **don't reword any of it.** Raise these with the client as scope decisions (see [section 12](#12-open-questions-for-the-client)).

---

## 2. Health-data posture (engineering view, not legal advice)

The app processes data that regulators treat as sensitive: searches for mental-health care, saved therapists, and session requests that may include a reason for seeking therapy. Three regimes matter.

- **HIPAA:** may or may not apply. A directory that isn't a covered entity is usually not a business associate, but this depends on contracts and data flows. **Get counsel's answer before launch.**
- **FTC Health Breach Notification Rule (amended 2024):** clarifies coverage of health apps outside HIPAA. Enforcement (GoodRx, BetterHelp, Cerebral) targeted health data shared through **ad pixels and SDKs**.
- **Washington My Health My Data Act:** treats data that indicates someone is *seeking* health services, including precise location tied to care, as consumer health data. It requires opt-in consent for collection or sharing beyond the requested service, and it restricts geofencing.

### Design rules this plan bakes in, so the answer doesn't change the architecture

1. **No third-party ad or marketing pixels or SDKs anywhere.**
   - No Meta, Google Ads, TikTok or LinkedIn tags.
   - No Google Analytics.
   - No session replay on app routes.
   - Enforce this with a CSP whose `script-src`/`connect-src`/`img-src` allowlist blocks them (see [5.11](#511-observability-security-headers-rate-limits)).
2. **PHI-minimal email.** Emails carry no patient name, reason, diagnosis, provider specialty or free text. They say "You have a new request on PsychMind" and link to an authenticated page (`/provider/requests/{uuid}`). Turn off Resend open and click tracking: it rewrites links and adds pixels.
3. **No PHI in URLs or query strings.** Search filters are taxonomy IDs and a ZIP or state. They are not free-text symptoms, which stay in component state or a POST body. Request IDs are UUIDs.
4. **No PHI in logs or errors.**
   - Sentry runs with `sendDefaultPii: false` and no Replay on app routes.
   - A `beforeSend` scrubber removes request bodies and form values.
   - Server logs carry IDs, not content.
5. **Search-keyword analytics are de-identified and thresholded.**
   - Store matched taxonomy term IDs and coarse geography. Store no user ID and no IP.
   - Visitors are identified only by a salted hash that rotates daily.
   - Show a keyword to a provider only when 5 or more searches in the period contain it.
6. **Least privilege everywhere.**
   - RLS on every table.
   - Private bucket for license documents, with 60-second signed URLs.
   - Admin MFA (`aal2`) enforced in RLS.
   - An audit log for sensitive actions.
7. **Retention.**
   - Raw analytics events: 90 days, then daily rollups only.
   - Search logs: 12 months.
   - Closed session requests: 24 months.

   These are placeholders for counsel to confirm.

### BAA availability if counsel says yes

| Vendor | BAA? | Notes |
|---|---|---|
| Supabase | Yes, **Team plan ($599/mo) + HIPAA add-on** | Add-on price isn't published; third parties report about $350/mo. PITR ($100/mo per 7 days) and MFA are expected. Pro has no BAA path. |
| Vercel | Yes, **Pro self-serve, paid add-on** | Announced 2025-09-09. Vercel's Pro-plan docs list $350/mo (third-party confirmed). Redlines need Enterprise. |
| Resend | **Reportedly no** (competitor's claim, unconfirmed with Resend) | Keeping PHI out of email (rule 2) makes this a non-issue. Otherwise switch transactional email to a BAA vendor (for example Paubox). Confirm in writing. |
| Sentry | Yes, Business tier or higher | Rule 4 makes the BAA optional. |
| Stripe | Not needed | It only holds provider billing (B2B), no patient data. |
| Upstash | Not needed | Keys are hashed IP or user ID only. |

**HIPAA-mode floor:** roughly $1.3k to $1.5k a month in extra platform cost. That's a business decision. The architecture is identical in both modes.

**Licensure rule that affects search (domain, not legal advice):** telehealth generally requires the clinician to be licensed or authorized in the state where the client is physically located. PSYPACT and the Counseling Compact help only between operational member states. So the "Online" search results **must filter by `patient_state IN provider license/compact states`**, not by radius. Model licenses per state (see [section 7](#7-database-schema-sketch)).

---

## 3. Stack decision: compared options

| Criterion | **A. Supabase (recommended)** | B. Neon + Drizzle + Better Auth | C. Neon/Supabase DB + Clerk |
|---|---|---|---|
| Services to wire | 1 backend (DB, auth, storage, cron, queues, PostGIS) | DB + auth library + separate storage (Vercel Blob/S3) + cron (Vercel) + queue | DB + Clerk + storage + cron |
| Authorization model | RLS keyed on `auth.uid()` and JWT claims, native | App-level checks. RLS on Neon is possible via Neon Auth/Data API, but Neon Auth is beta (Better Auth 1.4.x, no custom plugins). | App-level, or Clerk JWT templates into RLS (extra glue) |
| Patient identity data | Stays in your Postgres | Stays in your Postgres | **Held by a third party** (another vendor in the health-data chain) |
| Custom auth UI in the PsychMind design | Yes, our own forms | Yes | Clerk components need heavy theming, and custom flows hit limits |
| Geo search | PostGIS available as an extension | PostGIS on Neon is fine | Same as the chosen DB |
| Local dev | `supabase start` gives the full stack in Docker: Postgres, Auth, Storage, Mailpit, Studio | Neon branches (cloud) or local Postgres plus emulating the rest | Clerk dev instance (cloud) |
| Preview environments | Supabase Branching plus Vercel integration syncs env vars per PR | Neon branching (excellent) plus Vercel integration | Clerk has no per-PR identity |
| Types | `supabase gen types` (DB, RPCs, enums) | Drizzle schema is the types (best-in-class) | Same as DB choice |
| Cost at MVP | Pro $25 plus usage | Neon free/launch tier + Better Auth $0 + Blob usage | Clerk per-MAU above the free tier, plus DB |
| HIPAA path | Team + add-on | Neon: Scale/enterprise BAA (quote) | Clerk BAA enterprise (verify) |
| Lock-in | Moderate. It's still plain Postgres and auth is portable via the `auth.users` export. | Low | High for identity |

**Verdict:** Option A.

- **What B does better:** B has better TypeScript ergonomics and lower lock-in.
- **What B costs:** three or four more integrations, app-level authorization without database-enforced RLS, and a beta auth product if you want RLS. That's more surface for Claude Code to get subtly wrong, and more ops.
- **Why not C:** C hands patient identities to another vendor and fights the custom design system.

**Inside option A, don't add Drizzle or Prisma.**

- RLS needs queries to run with the user's JWT. supabase-js does that natively, and an ORM would need per-transaction claim injection.
- Use supabase-js with generated types for CRUD, and Postgres functions (RPC) for search and analytics.

---

## 4. Recommended stack and versions

| Concern | Choice (npm version, 2026-10-07) | Notes |
|---|---|---|
| Framework | `next` **16.x**. Upgrade 16.2.12 to the latest 16.x (16.4.0) in Slice 0 behind a green build. | `proxy.ts` replaces `middleware.ts` (Node runtime only). `revalidateTag(tag, profile)` takes 2 arguments. `updateTag` and `refresh` exist for Server Actions. `cacheComponents` (PPR + `use cache`) is the opt-in caching model. |
| DB/Auth/Storage | Supabase. `@supabase/ssr` **0.12.7**, `@supabase/supabase-js` **2.117.x**, CLI `supabase` **2.120.x** | Use the publishable key (`sb_publishable_…`) and secret key (`sb_secret_…`). Legacy anon and service_role keys are being retired (late 2026). Enable asymmetric JWT signing keys so `getClaims()` verifies locally. |
| Geo | PostGIS `geography(Point,4326)`, GiST index, `ST_DWithin` + `<->` | US ZIP centroids come from the Census Gazetteer ZCTA file, loaded into a table. Patient locations never go to a geocoding vendor. |
| Billing | Stripe Billing: Checkout (subscription mode) + Customer Portal + webhooks. `stripe` **23.0.0**, which pins API **2026-09-30.endive**. | Smart Retries on. Our own 3-day app-level grace (see [5.8](#58-billing-stripe)). Billing fee is 0.7% of billing volume on top of processing. |
| Email | `resend` **6.32.x** + `react-email` **6.x** (single package since v6, with Tailwind 4 support since v5) | Supabase Auth uses Resend through custom SMTP. Transactional email goes through the Resend API from the server. |
| Forms | `react-hook-form` **7.89** + `@hookform/resolvers` **5.9** + `zod` **4.6** | Server Actions always re-validate with the same Zod schema. Why not Conform: see below. |
| URL state | `nuqs` **2.10.1** (`nuqs/adapters/next/app`) | Parsers are shared between server (`createSearchParamsCache`) and client. Search uses `shallow: false`. |
| Charts | `recharts` **3.10** through the shadcn `chart` wrapper (copied into `ui/chart.tsx`) | Colors come from CSS variables mapped to PsychMind tokens. Lazy-load the charts client-side. |
| Rich text | Tiptap **3.31** (`@tiptap/react`, `starter-kit`, `@tiptap/static-renderer`) | Store ProseMirror JSON. Render to HTML on the server and sanitize. `immediatelyRender: false`. |
| UI primitives | Stay on **Radix** (`radix-ui` 1.7). Add shadcn components with `-b radix`. | shadcn switched its default to Base UI in July 2026, but Radix remains fully supported. Don't migrate mid-build. |
| Toasts | `sonner` 2.0.x, themed with tokens | |
| Rate limiting | `@upstash/ratelimit` **2.2** + `@upstash/redis` **1.39** (free tier: 500K commands a month) | Sliding window keyed by user ID or a hashed IP. |
| Errors | `@sentry/nextjs` **11.5** (supports Next 16 and Turbopack) | `instrumentation.ts` + `instrumentation-client.ts`. Export `onRequestError`. `sendDefaultPii: false`. Use a tunnel route. |
| Analytics | `@vercel/analytics` **2.0** on `(site)` only (cookieless). First-party `analytics_events` for provider dashboards. | No GA, no pixels. |
| Unit tests | `vitest` **5.0** (Node 22.12+ or 24) | Covers schemas, scoring helpers and utilities. |
| E2E | `@playwright/test` **1.64** | One smoke spec per slice. |
| DB tests | pgTAP via `supabase test db` + basejump `supabase_test_helpers` | RLS tests are mandatory per table. |
| Sanitizing | `isomorphic-dompurify` 4.5 (or a strict allowlist renderer) | Used for blog HTML. |
| Guard | `server-only` | Imported by every DAL, admin and secret module. |

**Why React Hook Form over Conform, for this project:**

- The two heaviest forms are client-state-heavy: the multi-step onboarding wizard with autosave, and the profile editor with live preview (it needs `watch()`).
- Every form sits behind auth, where no-JS progressive enhancement doesn't matter.
- The existing shadcn `Field`/`FieldError` already accepts an `errors` array.
- Claude Code is most fluent in RHF.
- Server errors map back with a 10-line `applyActionErrors(form, result)` helper.

Choose Conform instead only if progressive enhancement becomes a requirement.

---

## 5. Architecture

### 5.1 Request path and security layers

```
Browser ──► proxy.ts (Node) ──► Server Component / Server Action / Route Handler ──► DAL (server-only) ──► Supabase (RLS)
            │ refresh session cookies (getClaims)        │ requireUser()/requireRole() + Zod                  │ policies per role
            │ optimistic redirect by role claim          │ rate limit (Upstash)                                │ column grants
            │ never trusted alone                        │ audit() for sensitive mutations                    │ security-definer helpers in `private`
```

- **`src/proxy.ts`** (same level as `app`):
  - Creates a Supabase server client with request and response cookie adapters (`getAll`/`setAll`) and calls `supabase.auth.getClaims()`.
  - Returns the response that carries any refreshed cookies, and applies the no-cache headers that `setAll` provides. A cached Set-Cookie can sign one user in as another, so this matters.
  - Optimistic redirects: anonymous users on `/account|/provider|/admin` go to `/login?next=…`. A role mismatch goes to that role's home.
  - Matcher: exclude `_next/static`, `_next/image`, images, fonts, `api/stripe/webhook`, `api/events` and `cms`.
  - The Next docs warn that Proxy is not a security boundary: it only does optimistic checks.
- **DAL (`src/server/auth/session.ts`):**
  - `getSession = cache(async () => …getClaims())`.
  - `requireUser()`, `requireRole('provider' | 'patient' | 'admin')`, `requireProvider()` (returns `provider_id`), and `requireAdminAal2()`.
  - Called in every page that shows private data, every Server Action and every Route Handler.
  - Layouts **don't** guard: they don't re-render on navigation (Next auth guide).
- **RLS** is the last line. Every table has `enable row level security`. Policies name the role (`to authenticated` / `to anon`) and wrap functions as `(select auth.uid())` for per-statement evaluation. Every column a policy filters on is indexed.

### 5.2 Supabase clients (`src/lib/supabase/`)

| File | Key | Cookies | Use |
|---|---|---|---|
| `client.ts` (browser) | publishable | browser | Client components that need realtime or direct storage upload (license docs, avatars) under RLS |
| `server.ts` (`server-only`) | publishable | `await cookies()` | Default for all server reads and writes **as the user** (RLS applies) |
| `public.ts` (`server-only`) | publishable | none (`persistSession:false`) | Public, cacheable reads inside `'use cache'` (listed profiles, taxonomy, blog). Only `anon` policies apply. |
| `admin.ts` (`server-only`) | **secret** | none | Stripe webhook, cron routes, analytics ingest. An ESLint `no-restricted-imports` rule allows it only in `src/app/api/**` and `src/server/jobs/**`. |

Env vars, validated with Zod in `src/lib/env.ts` (server) and `src/lib/env.client.ts`:

- Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SENTRY_DSN`
- Secret: `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PROVIDER_MONTHLY`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`, `ANALYTICS_SALT_SECRET`, `SENTRY_AUTH_TOKEN`
- Kept from today: `CONTACT_*` and the `GITHUB_OAUTH_*` (Decap) variables

### 5.3 Auth flows (Supabase Auth)

- **Sign-up** (`/signup`, with `?role=provider` supported because the site already links it):
  - Collects email and password, plus `signup_role` in `options.data`.
  - A trigger `on auth.users insert` creates `profiles` and `user_roles`, accepting **only** `patient|provider`. Admins are assigned by SQL or seed only.
- **Email verification:**
  - Supabase "Confirm email" is ON.
  - Templates link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=…`.
  - `src/app/auth/confirm/route.ts` calls `verifyOtp({ type, token_hash })`, sets cookies, then redirects to a role home or the validated `next` path.
  - The token-hash pattern avoids the PKCE "same browser" failure when a link opens on a phone.
- **Magic link:** `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })` on the login page as "Email me a sign-in link". `shouldCreateUser:false` keeps role assignment inside the sign-up flow.
- **Forgot/reset:** `resetPasswordForEmail` takes the user to `/auth/confirm?type=recovery`, then to `/reset-password`, which calls `updateUser({ password })`.
- **Google:** the button exists in the approved design. Supabase Google OAuth uses `/auth/callback` with `exchangeCodeForSession`. Recommend **Slice 13 (optional)** after a client decision. Hide or disable the button until then, which needs client sign-off because it changes the approved UI.
- **Roles in the JWT:**
  - A Custom Access Token Hook (`public.custom_access_token_hook`) adds the `user_role` claim from `user_roles`. Grant execute to `supabase_auth_admin` only.
  - Proxy uses the claim for redirects. RLS uses it through `private.current_role()`.
  - Role changes apply on the next token refresh. Rare, and acceptable.
- **Hardening:**
  - Custom SMTP through Resend, so emails come from the PsychMind domain. The default sender allows only a few emails per hour.
  - Tune Auth rate limits.
  - Enable leaked-password protection and a minimum password length of 10.
  - Admins enroll TOTP MFA, and admin RLS requires `(select auth.jwt()->>'aal') = 'aal2'`.
  - Optional: Turnstile CAPTCHA on sign-up and OTP if abuse appears.
- **Auth email templates:** author them in React Email (`src/emails/auth/*`). Export them to static HTML with `email export` and paste or sync into `supabase/templates/*.html`, referenced from `config.toml` for local, and paste them into the dashboard for production.

### 5.4 Data access and mutations

- **Reads:** `src/features/<feature>/queries.ts` (`import 'server-only'`) export typed functions that return small DTOs (Next data-security guide). Use `React.cache` for per-request dedupe.
- **Mutations:** `src/features/<feature>/actions.ts` (`'use server'`), each built with one wrapper:

```ts
// src/server/actions/create-action.ts (sketch)
export function createAction<S extends z.ZodType, R>(opts: {
  schema: S;
  role?: 'patient' | 'provider' | 'admin' | 'any';
  rateLimit?: { key: string; limit: number; window: `${number} ${'s'|'m'|'h'|'d'}` };
  handler: (input: z.infer<S>, ctx: { userId: string; role: Role; supabase: SupabaseServerClient }) => Promise<R>;
}): (prev: ActionResult<R> | null, input: z.infer<S> | FormData) => Promise<ActionResult<R>>;
// ActionResult = { ok: true, data } | { ok: false, formError?: string, fieldErrors?: Record<string,string[]> }
```

- The wrapper authenticates, checks the role, rate-limits, parses with Zod, runs the handler, maps Postgres errors (RLS denial and unique violations) to friendly messages, reports unexpected errors to Sentry with PII stripped, and never throws to the client. `redirect()` is called outside try/catch.
- **After a mutation:**
  - `updateTag('provider:<id>')` when the user must see their change immediately (profile publish).
  - `revalidateTag('<tag>', 'max')` for background refresh (webhooks).
  - `refresh()` to refresh client router data.
- **Side effects** (emails, analytics writes) run in `after()` so they don't block the response. Durable retries go through an `email_outbox` row drained by a cron route. A failed send never loses the notification.

### 5.5 Caching (Next 16)

- **Enable `cacheComponents: true` in Slice 0** and fix any build errors (usually "uncached data outside Suspense").
  - Marketing pages are already static (fs reads at build), so they stay prerendered.
  - If this becomes a time sink, ship without it: everything still works dynamically. Revisit in Slice 13.
- **Public provider profile `/providers/[slug]`:**
  - `getPublicProfile(slug)` uses `'use cache'`, `cacheLife('days')` and `cacheTag('provider:'+id, 'providers')`, with the `public.ts` client.
  - Viewer-specific bits (the "Saved" state, the request button state) are small dynamic components inside `<Suspense>`.
- **Invalidation:**
  - Profile publish calls `updateTag`.
  - Admin approve or suspend and Stripe status changes call `revalidateTag('provider:'+id,'max')`.
  - Grace expiry is time-based, so an hourly `/api/cron/visibility-sweep` revalidates tags for providers whose `grace_until` just passed.
- **Search results are not cached in Next.** They depend on `searchParams` and Postgres answers in milliseconds at this scale. The static shell (header and filter chrome) still prerenders.
- **On Vercel,** `use cache` runtime entries are in-memory per instance and don't persist across serverless invocations (Next docs). That's fine here. Use `'use cache: remote'` only if database load ever matters.
- **Taxonomy lists** (specialties and so on) use `'use cache'` + `cacheLife('weeks')` + `cacheTag('taxonomy')`.

### 5.6 Search design (fast, filterable, "close enough")

**Inputs, as URL state through nuqs. No free-text PHI in the URL:**

- `zip` (or `lat`/`lng` from browser geolocation, used once and never stored)
- `state`, `radius` (5/10/25/50 mi), `format` (`online|in_person|any`)
- `specialty[]`, `approach[]`, `language[]`, `age[]`, `gender[]` (taxonomy slugs)
- `feeMax`, `accepting`, `page`

The free-text "What's on your mind?" box maps to taxonomy terms client-side through synonym lookup (a `taxonomy_terms.synonyms` trigram index exposed by a cached RPC). Only the resulting term slugs go to the URL. The raw text never leaves the browser in the MVP.

**Engine:** one SQL function `public.search_providers(...)` (stable, `security invoker`, `search_path=''`) over a denormalized **`provider_search`** table:

- One row per listed provider.
- Kept fresh by triggers on `providers`, `provider_terms`, `provider_locations`, `provider_licenses` and `subscriptions`, all calling `private.refresh_provider_search(provider_id)`.

**Hard constraints (never relaxed):**

1. `listable` (verified, published, subscription active or trialing or past_due) **and** (`grace_until is null or grace_until > now()`). Visibility is exact to the second without depending on cron.
2. `format=online` requires `patient_state = any(license_states)`. `format=in_person` requires `ST_DWithin(location, point, radius_m * 1.5)`. `any` is the union.

**Soft criteria (scored, weights tunable in one SQL constant):**

| Criterion | Weight |
|---|---|
| Specialties overlap | 3 each, capped at 9 |
| Approaches | 2 each, capped at 4 |
| Language | 5 |
| Gender | 3 |
| Age group | 3 |
| Fee within `feeMax` | 2, with a partial score for up to 20% over |
| Distance | Inside the radius: 3 × (1 − d/r). Between r and 1.5r: 0. |
| Accepting new clients | 1 |
| Text match on bio (`websearch_to_tsquery` against a generated `tsvector`) | 1 |

**Output columns:** `provider_id, tier, score, distance_miles, missed text[]`.

- `tier = 1` means every requested soft criterion matched (and the provider is inside the radius).
- `tier = 2` means "close enough": at most 2 criteria missed, or within 1.5× the radius.
- Everything else is dropped.
- Ordering is `tier, score desc, distance`.
- `missed` drives honest UI copy such as "Close match: doesn't list Spanish · 12 mi away". Microcopy is new, so draft it and flag it for client approval.

**Indexes on `provider_search`:**

- GiST on `location`
- GIN on `term_ids` (`gin__int_ops` via `intarray`)
- GIN on `license_states`
- GIN on `search_tsv`
- Partial btree on `(listable) where listable`

**Performance target:** p95 under 50 ms in the database and under 200 ms server TTFB for 500 providers. Test with a 5k-row synthetic seed.

**UI:**

- `/providers` page server component: parse with the nuqs cache, call the RPC through `server.ts`, render the results inside `<Suspense fallback={<ResultsSkeleton/>}>`.
- Client filter bar on desktop. A `Sheet` with filters on mobile.
- `useQueryStates` with `shallow:false`. `history:'replace'` for sliders and `'push'` for discrete changes. Debounce at 300 ms.
- Empty state offers "widen radius" and "switch to Online" buttons.
- The home hero `SearchTool`/`MobileSearchTrigger` become real links into `/providers?...` without changing copy or visuals.

**Impressions** are logged from the results component with `after()`: one batched insert of the shown provider IDs with the search's term IDs, via the admin client.

### 5.7 File storage

| Bucket | Visibility | Path | Policies | Notes |
|---|---|---|---|---|
| `license-docs` | **private** | `{provider_id}/{uuid}.{ext}` | insert/select/delete for owner where `(storage.foldername(name))[1] = private.my_provider_id()::text` (delete only while status is draft or changes_requested). Select for admin (aal2). No public access. | Bucket `file_size_limit` 10 MB, `allowed_mime_types` pdf/jpeg/png. Admins view through `createSignedUrl(path, 60)` in a server action, which writes an `audit_log` row ("document_viewed"). |
| `provider-media` | public read | `{provider_id}/avatar-{uuid}.webp`, `{provider_id}/posts/{uuid}.webp` | Write only by owner (folder check). Read public. | Add `<project>.supabase.co` to `images.remotePatterns`. Resize on the client before upload, or use Supabase image transforms (Pro). |

Uploads go directly from the browser client under RLS, with no server relay. The server records metadata (`provider_documents` row) in the same action. Old avatars are deleted on replace.

### 5.8 Billing (Stripe)

**Flow:**

1. Admin approves the provider.
2. The provider's dashboard shows "Activate listing".
3. A server action creates or gets the Stripe Customer (`billing_customers`) and starts a Checkout Session (mode `subscription`, one monthly price, `client_reference_id = provider_id`, `metadata.provider_id`).
4. Return to `/provider/billing?status=success`. The UI waits on the webhook-driven status: poll `router.refresh()` a few times and show a skeleton.
5. "Manage billing" opens a Customer Portal session (update card, cancel, invoices).

**Webhook** `src/app/api/stripe/webhook/route.ts`:

- Runtime `nodejs`. Read the raw body with `req.text()` and run `stripe.webhooks.constructEvent`.
- Idempotency: insert into `stripe_events(id)` with `on conflict do nothing`. If the row already exists, return 200.
- For any subscription-related event, **re-fetch the subscription from the Stripe API**. Never trust event order. Then upsert `subscriptions`.
- Events to handle: `checkout.session.completed`, `customer.subscription.created|updated|deleted|paused|resumed`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `charge.dispute.created`.
- Return 500 on failure so Stripe retries (up to 3 days in live mode).

**Grace logic** (the brief: "3-day grace period, then hidden from search"):

- When status becomes `past_due`, set `past_due_since = coalesce(past_due_since, now())` and `grace_until = past_due_since + interval '3 days'`.
- Back to `active`/`trialing`: clear both.
- `unpaid`/`canceled`/`incomplete_expired`/`paused`: `listable=false` immediately.
- Search hides at `grace_until` automatically (see [5.6](#56-search-design-fast-filterable-close-enough)).
- Stripe Dashboard: enable Smart Retries. After the final retry, set the subscription to **`unpaid`** (Stripe docs: revoke access on `unpaid`/`canceled`). Stripe keeps retrying beyond our 3 days, and the listing reappears automatically on `invoice.paid`.

**Emails** (PHI-free): payment failed (day 0, with a Portal link), grace ends tomorrow (day 2, via cron), listing hidden (day 3), listing restored.

**Reconciliation:** a daily Vercel Cron `/api/cron/stripe-reconcile` lists subscriptions changed in the last 48 hours and re-syncs them, to catch missed webhooks.

**Testing:**

- `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Stripe **test clocks** to advance through renewal, failure, grace and hide.
- Card `4000 0000 0000 0341` (attaches, then fails).

**Open decisions:** trial length, price, charging before vs after verification (recommended: after), proration, and annual plans (later).

### 5.9 Email

- `src/emails/` holds React Email components styled with a small email-safe token map (brand crimson, warm grays, Ivar/Geist fallbacks to Georgia and system sans). Email clients can't load the site fonts reliably.
- `src/server/email/send.ts` wraps `resend.emails.send({ react })` with a template registry. It enforces a `PhiSafe` type: payload fields are IDs, first names of the *recipient* only, and links.
- Every send is logged to `email_outbox` (status/attempts) for retry and audit.
- Templates:
  - Auth: confirm, magic link, recovery, email change.
  - Provider: application received, approved, changes requested, rejected, new session request, payment failed, grace ending, listing hidden, listing restored, weekly digest (later).
  - Patient: request sent, request status updated.
  - Admin: new application to review.
- Sending domain: verify SPF/DKIM and set DMARC. Disable open and click tracking.

### 5.10 Analytics

- **Marketing:** `<Analytics />` from `@vercel/analytics` mounted only in `(site)/layout.tsx`. It's cookieless and stores hashed, anonymized data.
- **Provider analytics (first-party), events table:**

| Event | Captured where |
|---|---|
| `search_impression` | Server, `after()` in the results component |
| `profile_view` | Client beacon `<TrackView/>`, sent to `POST /api/events` (Zod-validated, rate-limited, deduped per visitor-day, excludes the provider's own views and obvious bots by user agent) |
| `save` / `unsave` | Server action |
| `request_created` | Server action |
| `contact_click` (website/phone) | Beacon |

- Rows carry `provider_id`, `type`, `occurred_at`, `term_ids int[]` (impressions only), `visitor_hash` (HMAC(daily salt, IP + UA), truncated) and `source`. **No user ID, no IP.**
- **Rollups:** pg_cron runs every hour and upserts into `provider_stats_daily` (impressions, unique viewers, views, saves, requests) and `provider_keyword_stats_weekly` (term ID, count). It purges raw events older than 90 days.
- **Dashboard:** `/provider/analytics` has a date range (7/30/90 days), stat tiles with deltas, a line chart (views and impressions), a bar chart (top keywords, only terms with count ≥ 5), and conversion (views to requests).

### 5.11 Observability, security headers, rate limits

- **Sentry:**
  - `withSentryConfig` in `next.config.ts`, `instrumentation.ts` (server/edge init and `export const onRequestError = Sentry.captureRequestError`), and `instrumentation-client.ts`.
  - `sendDefaultPii:false`, `tracesSampleRate:0.1`.
  - **No Replay integration.** If it's ever added, restrict it to `(site)` routes with masking on.
  - `beforeSend` strips `request.data`, cookies and query strings on `/account|/provider|/admin` URLs.
  - `tunnelRoute: '/monitoring'`.
- **Headers** (`next.config.ts headers()`):
  - CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline' va.vercel-scripts.com` (tighten to nonces later if needed); `connect-src 'self' *.supabase.co *.sentry.io vitals.vercel-insights.com`; `img-src 'self' data: blob: images.unsplash.com *.supabase.co`; `frame-src https://js.stripe.com https://checkout.stripe.com`; `form-action 'self' https://checkout.stripe.com`.
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
  - `X-Content-Type-Options: nosniff`
  - `frame-ancestors 'none'`
  - HSTS
- **Rate limits (Upstash sliding window):**

| Target | Limit |
|---|---|
| `contact` | 5/h per IP hash |
| `session_request.create` | 5/h and 20/day per user |
| `events` beacon | 60/min per IP hash |
| `signup`/`otp` | 5/h per IP hash (on top of Supabase's own limits) |
| `upload-intent` | 20/h per user |
| `search` | 120/min per IP hash |

  Set `timeout` to fail open for reads and fail closed for writes.

### 5.12 Provider blog posts

- **Editor:** Tiptap v3 in `ui/rich-text-editor.tsx`, with `immediatelyRender:false`.
  - Allowed extensions: StarterKit (paragraph, H2/H3, bold, italic, lists, blockquote, hard break, horizontal rule), Link (http/https only, `rel="noopener nofollow ugc"`), Image (uploads to `provider-media/{id}/posts/`), Placeholder, CharacterCount.
  - Toolbar built from `Button` `ghost`/`icon-sm`.
- **Storage:** `posts.content_json` (jsonb) is the source of truth. `content_html` is rendered on save, server-side, with `@tiptap/static-renderer` (the same extension list) and sanitized with DOMPurify.
- **Rendering:** public posts render with the existing article typography (`blog/[slug]`, `type-*` roles, `reading-progress`). Company markdown posts and provider DB posts merge in `getAllPosts()`. Long-term, migrate company posts to the DB and retire Decap.
- **Moderation:** recommended default is a `pending_review` status that admins approve before publish. Health content written by providers carries liability. Client decision.

---

## 6. Folder and route structure

Route groups don't change URLs. Existing URLs (`/login`, `/blog/...`) stay identical.

```
website/
├─ CLAUDE.md                        # conventions (section 10)
├─ next.config.ts                   # + cacheComponents, headers(), withSentryConfig, image domains, /cms rewrite
├─ instrumentation.ts / instrumentation-client.ts   # (in src/)
├─ supabase/
│  ├─ config.toml                   # local auth (site_url, redirect urls, email templates, hook), storage buckets
│  ├─ schemas/                      # DECLARATIVE source of truth, one file per domain
│  │  ├─ 00_extensions.sql  01_enums.sql  02_private_helpers.sql  10_profiles_roles.sql
│  │  ├─ 20_taxonomy.sql  21_geo.sql  30_providers.sql  31_provider_search.sql  40_billing.sql
│  │  ├─ 50_requests.sql  60_saves.sql  70_posts.sql  80_analytics.sql  90_audit.sql  95_storage.sql  99_cron.sql
│  ├─ migrations/                   # generated by `supabase db diff -f <name>` + hand-written DML/RLS-alter migrations
│  ├─ seed.sql                      # generated by scripts/seed (deterministic)
│  ├─ templates/                    # auth email HTML exported from React Email
│  └─ tests/database/*.test.sql     # pgTAP: rls_<table>.test.sql, search.test.sql, transitions.test.sql
├─ scripts/
│  ├─ seed/generate.ts              # faker with fixed seed → supabase/seed.sql (50 providers etc.)
│  └─ geo/load-zcta.ts              # Census Gazetteer ZCTA → zip_centroids (subset for seed, full for prod)
├─ tests/
│  ├─ e2e/                          # Playwright: slice-03-auth.spec.ts … ; fixtures/roles.ts (storageState per role)
│  └─ setup/                        # global-setup: db reset + seed, mailpit helper, stripe helpers
├─ docs/specs/                      # slice specs (in-repo copy; see section 10)
└─ src/
   ├─ proxy.ts
   ├─ app/
   │  ├─ layout.tsx                 # root: fonts, <Toaster/>, NuqsAdapter (no Lenis here)
   │  ├─ (site)/                    # existing marketing (Lenis + header/footer + Vercel Analytics)
   │  │  ├─ layout.tsx  page.tsx  blog/  contact/  how-it-works/  mission/  legal pages…
   │  │  └─ providers/              # PUBLIC search + profiles live in the marketing shell
   │  │     ├─ page.tsx  loading.tsx
   │  │     └─ [slug]/page.tsx  [slug]/request/page.tsx   # request form (requires patient)
   │  ├─ (auth)/                    # centered split-card layout derived from current /login
   │  │  ├─ layout.tsx
   │  │  ├─ login/page.tsx          # MOVED from app/login (URL unchanged)
   │  │  ├─ signup/page.tsx  forgot-password/page.tsx  reset-password/page.tsx  check-email/page.tsx
   │  ├─ auth/confirm/route.ts      # verifyOtp(token_hash)
   │  ├─ auth/callback/route.ts     # OAuth code exchange (Google, later)
   │  ├─ (patient)/account/         # → /account
   │  │  ├─ layout.tsx              # AppShell (patient nav)
   │  │  ├─ page.tsx  saved/page.tsx  requests/page.tsx  requests/[id]/page.tsx  settings/page.tsx
   │  ├─ (provider)/provider/       # → /provider
   │  │  ├─ layout.tsx              # AppShell (provider nav, status banner: verification/billing/grace)
   │  │  ├─ page.tsx                # overview: checklist + key stats
   │  │  ├─ onboarding/[step]/page.tsx
   │  │  ├─ profile/page.tsx        # editor + live preview
   │  │  ├─ requests/page.tsx  requests/[id]/page.tsx
   │  │  ├─ analytics/page.tsx  posts/page.tsx  posts/[id]/page.tsx  billing/page.tsx  settings/page.tsx
   │  ├─ (admin)/admin/             # → /admin  (Decap moved to /cms)
   │  │  ├─ layout.tsx              # AppShell (admin), requires aal2
   │  │  ├─ page.tsx  verifications/page.tsx  verifications/[providerId]/page.tsx
   │  │  ├─ providers/page.tsx  posts/page.tsx  audit/page.tsx  taxonomy/page.tsx
   │  ├─ api/
   │  │  ├─ stripe/webhook/route.ts  events/route.ts  cron/[job]/route.ts  contact/route.ts
   │  │  └─ cms/auth/route.ts  cms/callback/route.ts     # Decap OAuth (moved + origin/state fix)
   │  ├─ dev/ui/page.tsx            # kitchen-sink of primitives; 404 in production (notFound() unless NODE_ENV=development)
   │  ├─ not-found.tsx  error.tsx  global-error.tsx
   ├─ components/
   │  ├─ ui/                        # THE design system (extend here only)
   │  ├─ app/                       # app compositions: app-shell, app-nav, page-header, stat-tile, status-badge, empty-state, data-table, step-wizard
   │  └─ …existing marketing folders unchanged (home/, blog/, how-it-works/, shared/, motion/…)
   ├─ features/                     # vertical slices; each: components/, queries.ts, actions.ts, schemas.ts, types.ts
   │  ├─ auth/  onboarding/  profile/  search/  saves/  requests/  billing/  analytics/  posts/  admin/
   ├─ server/                       # server-only infrastructure
   │  ├─ auth/session.ts  actions/create-action.ts  ratelimit.ts  stripe.ts  audit.ts
   │  ├─ email/send.ts  jobs/*.ts (cron handlers)
   ├─ emails/                       # React Email templates (auth/, provider/, patient/, admin/, _tokens.ts)
   ├─ lib/
   │  ├─ supabase/{client,server,public,admin}.ts
   │  ├─ env.ts  env.client.ts  utils.ts  gsap.ts  blog.ts  photos.ts  format.ts (money, distance, dates)
   └─ types/database.types.ts       # GENERATED, never hand-edited
```

### Shared layouts

| Layout | Contents |
|---|---|
| `(site)` | Unchanged: Lenis, header, footer, Vercel Analytics. `/providers` lives here so search and profiles feel like the marketing site and reuse the header. |
| `(auth)` | No Lenis. Simple header with logo and "Go back". Card split layout from the current login. |
| `(patient)`, `(provider)`, `(admin)` | A shared `AppShell` from `components/app`: top bar with logo and account menu, a left nav on desktop that becomes a bottom sheet on mobile, and a content `Container size="content"`. No Lenis, no GSAP scroll effects. CSS transitions use `--ease-out-soft`. Each layout fetches the user for the shell inside `<Suspense>`. The authorization check happens in pages and the DAL. |

### Design-system extension plan (`src/components/ui`)

The rules match the existing system and the standing memory rule:

- Tokens only: `rounded-tag|field|card|panel|pill`, `shadow-control|card|raised`, `text-text-*`, `bg-warm-*`, `type-*` roles, and spacing tokens.
- No arbitrary px.
- One focus ring (already global).
- All new components use `data-slot` and cva variants like `button.tsx`.

| Component | Base | Token notes |
|---|---|---|
| `input` (rework), `textarea` | native | Promote contact-form styling: `rounded-field border-warm-300/80 bg-white shadow-control`, focus `border-warm-600` plus a brand halo, `aria-invalid` turns the border `destructive`. Sizes `md` (h-11) and `lg` (h-12). |
| `select` | Radix Select | Trigger matches the input. Content uses `rounded-field shadow-raised bg-popover`. |
| `multi-select` / `chip-group` | Radix Popover + listbox, or a toggle-chip grid | Chips reuse `Tag`. The selected state reuses the existing `chip-select` look (ink fill `bg-warm-900 text-white`). Used for specialties, approaches, languages and age groups. |
| `checkbox`, `radio-group`, `switch`, `slider` | Radix | Brand primary for checked. Slider for fee and radius. |
| `toggle-group` | Radix | Generalize `SessionModeSwitch` (keep its look). |
| `dialog`, `alert-dialog`, `sheet` | Radix Dialog | `rounded-card shadow-raised`. Sheet slides from the right on desktop and the bottom on mobile (used for search filters and the mobile nav). |
| `tabs`, `dropdown-menu`, `popover`, `tooltip` | Radix | Tab underline in brand. Tooltip style borrowed from `trust-row` (`bg-warm-900 text-warm-100 rounded-field`). |
| `table` (+ `components/app/data-table`) | native table | Plain sortable table (≤ 500 rows). No TanStack Table until needed. |
| `toaster` | sonner | `rounded-field shadow-raised`, Geist, warm palette. Success in ink, error in destructive. |
| `skeleton` | div | `bg-warm-100 animate-pulse rounded-field`. Reduced motion is respected by the global rule. |
| `empty-state` | composition | Doodle from `ui/doodles.tsx`, then `type-h4` title, `type-body text-text-tertiary` body, and an optional action. |
| `badge` / `status-badge` | `Tag` variants | Request, verification and billing statuses. Color plus icon plus text, never color alone. |
| `avatar` | Radix Avatar | `rounded-4xl` like the profile showcase. |
| `stepper` / `progress` | composition | Onboarding wizard. Reuse `progress-fill` keyframes. |
| `file-dropzone` | native input + drag/drop | Upload progress, type and size errors, keyboard accessible. |
| `pagination` | `Button` | |
| `chart` | shadcn chart (Recharts 3) | `--chart-1: var(--color-brand-primary)`, `--chart-2: var(--color-warm-700)`, `--chart-3: var(--color-warm-300)`. Axis text `--color-text-placeholder`. Grid `--color-warm-200`. |
| `rich-text-editor` | Tiptap | Toolbar with ghost icon buttons. Content styled with the article prose used by the blog. |
| `card` (rework) | | `rounded-card border-warm-200 shadow-card bg-card`. |

Workflow: `npx shadcn@latest add <component> -b radix` copies the source in. Immediately restyle it to tokens and add it to `/dev/ui`. Never leave stock shadcn classes (`rounded-md`, `shadow-xs`, `ring-ring/50`) in place.

---

## 7. Database schema sketch

The SQL below is a sketch: names and types are indicative.

### 7.1 Extensions, schemas, enums

```sql
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists intarray with schema extensions;   -- gin__int_ops
create extension if not exists pg_cron;                            -- via Dashboard/Integrations
create extension if not exists citext with schema extensions;
create schema if not exists private;                               -- NOT exposed via Data API

create type public.app_role            as enum ('patient','provider','admin');
create type public.verification_status as enum ('draft','submitted','in_review','changes_requested','approved','rejected','suspended');
create type public.subscription_status as enum ('trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused');
create type public.request_status      as enum ('new','viewed','accepted','declined','withdrawn','closed','expired');
create type public.post_status         as enum ('draft','pending_review','published','archived');
create type public.event_type          as enum ('search_impression','profile_view','save','unsave','request_created','contact_click');
create type public.taxonomy_kind       as enum ('specialty','approach','language','age_group','profession','modality_detail');
create type public.document_status     as enum ('pending','accepted','rejected');
create type public.session_format      as enum ('online','in_person');
```

### 7.2 Tables (key columns)

```sql
-- identity
profiles (id uuid pk references auth.users on delete cascade, display_name text, created_at, updated_at)
user_roles (user_id uuid pk references auth.users on delete cascade, role app_role not null default 'patient', granted_by uuid, granted_at)

-- taxonomy & geo
taxonomy_terms (id smallint generated always as identity pk, kind taxonomy_kind, slug citext, label text, synonyms text[] default '{}',
                sort smallint, active bool default true, unique(kind, slug))
zip_centroids (zip char(5) pk, state char(2), location extensions.geography(Point,4326) not null)   -- Census Gazetteer ZCTA

-- providers (PUBLIC-SAFE columns only)
providers (id uuid pk default gen_random_uuid(), user_id uuid unique not null references auth.users,
           slug citext unique, status verification_status default 'draft',
           first_name, last_name, credentials text,        -- e.g. 'LMHC, M.S.'
           pronouns, profession_id smallint references taxonomy_terms,
           headline text check (char_length(headline) <= 140),
           who_i_work_with text, about text, approach_text text,
           photo_path text, years_experience smallint, education jsonb,
           gender text check (gender in ('woman','man','nonbinary','another')),
           offers_online bool default false, offers_in_person bool default false,
           accepting_new_clients bool default true,
           fee_min_cents int, fee_max_cents int, sliding_scale bool default false,
           website_url text, published bool default false, published_at timestamptz,
           verified_at timestamptz, verified_by uuid,
           search_tsv tsvector generated always as (to_tsvector('english', coalesce(headline,'')||' '||coalesce(about,'')||' '||coalesce(who_i_work_with,''))) stored,
           created_at, updated_at)
provider_private (provider_id uuid pk references providers on delete cascade,
                  legal_name text, phone text, npi text, internal_notes text)        -- owner + admin only
provider_terms (provider_id uuid references providers on delete cascade, term_id smallint references taxonomy_terms,
                primary key (provider_id, term_id))
provider_locations (id uuid pk, provider_id uuid references providers on delete cascade,
                    street text,                     -- private: never selected by anon (see grants)
                    city text, state char(2), postal_code char(5),
                    location extensions.geography(Point,4326), is_primary bool default true)
provider_licenses (id uuid pk, provider_id uuid references providers on delete cascade, state char(2), license_type text,
                   license_number text, expires_on date, via_compact text check (via_compact in ('psypact','counseling','none')),
                   verified bool default false, verified_at, verified_by)
provider_documents (id uuid pk, provider_id uuid references providers on delete cascade, kind text, storage_path text unique,
                    file_name text, mime text, size_bytes int, status document_status default 'pending',
                    reviewed_by uuid, reviewed_at, review_note text, uploaded_at)
verification_reviews (id uuid pk, provider_id uuid, admin_id uuid, decision verification_status, note_to_provider text,
                      internal_note text, created_at)

-- denormalized search table (maintained by private.refresh_provider_search)
provider_search (provider_id uuid pk references providers on delete cascade,
                 listable bool not null, grace_until timestamptz,
                 location extensions.geography(Point,4326), state char(2),
                 license_states char(2)[] not null default '{}',
                 term_ids int[] not null default '{}',          -- all kinds; kind split via taxonomy ids
                 gender text, fee_min_cents int, fee_max_cents int, sliding_scale bool,
                 offers_online bool, offers_in_person bool, accepting bool,
                 search_tsv tsvector, refreshed_at timestamptz)

-- billing
billing_customers (provider_id uuid pk references providers, stripe_customer_id text unique not null)
subscriptions (id text pk,                          -- Stripe sub id
               provider_id uuid references providers, status subscription_status, price_id text,
               current_period_end timestamptz, cancel_at_period_end bool,
               past_due_since timestamptz, grace_until timestamptz, updated_at timestamptz)
stripe_events (id text pk, type text, received_at timestamptz default now(), processed_at timestamptz, error text)

-- patients
saved_providers (patient_id uuid references auth.users on delete cascade, provider_id uuid references providers on delete cascade,
                 created_at, primary key (patient_id, provider_id))
session_requests (id uuid pk default gen_random_uuid(), patient_id uuid references auth.users, provider_id uuid references providers,
                  status request_status default 'new', format session_format, patient_state char(2),
                  age_group_id smallint, availability jsonb,        -- e.g. {"days":["mon","wed"],"times":["evening"]}
                  payment_preference text check (payment_preference in ('self_pay','insurance','unsure')),
                  message text check (char_length(message) <= 800),  -- optional; UI warns "don't include sensitive details"
                  contact_name text, contact_email text, contact_phone text,
                  provider_note text,                                -- provider-only private note
                  created_at, viewed_at, status_changed_at, closed_at)
session_request_events (id bigint identity pk, request_id uuid references session_requests on delete cascade,
                        from_status request_status, to_status request_status, actor_id uuid, created_at)

-- content
posts (id uuid pk, provider_id uuid references providers,     -- null = PsychMind staff post
       author_id uuid references auth.users, slug citext, title text, excerpt text, cover_path text,
       content_json jsonb, content_html text, status post_status default 'draft',
       published_at, created_at, updated_at, unique (slug))

-- analytics
analytics_events (id bigint identity pk, provider_id uuid not null, type event_type not null, occurred_at timestamptz default now(),
                  term_ids int[], visitor_hash text, source text)
provider_stats_daily (provider_id uuid, day date, impressions int, unique_viewers int, profile_views int, saves int,
                      requests int, contact_clicks int, primary key (provider_id, day))
provider_keyword_stats_weekly (provider_id uuid, week date, term_id smallint, impressions int, primary key (provider_id, week, term_id))
search_logs (id bigint identity pk, occurred_at timestamptz default now(), term_ids int[], state char(2),
             format text, result_count int, relaxed_count int)   -- no user, no IP

-- ops
email_outbox (id uuid pk, template text, to_user_id uuid, to_email text, payload jsonb,   -- payload: ids/links only
              status text default 'queued', attempts int default 0, last_error text, created_at, sent_at)
audit_log (id bigint identity pk, actor_id uuid, actor_role app_role, action text, entity_type text, entity_id text,
           diff jsonb, created_at timestamptz default now())
```

### 7.3 Indexes (beyond PKs and uniques)

- `provider_search`:
  - `using gist (location)`
  - `using gin (term_ids gin__int_ops)`
  - `using gin (license_states)`
  - `using gin (search_tsv)`
  - `(listable) where listable`
- `providers (user_id)`, `providers (status)`, `providers (slug)`
- `provider_terms (term_id, provider_id)`
- `provider_locations using gist (location)`, `provider_locations (provider_id)`
- `provider_licenses (provider_id)`, `provider_licenses (state)`
- `provider_documents (provider_id)`
- `subscriptions (provider_id)`
- `session_requests (provider_id, status, created_at desc)`, `session_requests (patient_id, created_at desc)`
- `saved_providers (provider_id)` (the PK already covers patient lookups)
- `posts (provider_id, status)`, `posts (status, published_at desc)`
- `analytics_events`: `using brin (occurred_at)` and `(provider_id, occurred_at)`
- `taxonomy_terms using gin (synonyms)` (plus a trigram index on a lowered concatenation for suggestions)
- `zip_centroids using gist (location)` (only for reverse lookups)
- `audit_log (entity_type, entity_id, created_at desc)`, `audit_log (actor_id, created_at desc)`

### 7.4 Helper functions (schema `private`: `security definer`, `set search_path = ''`, `stable`)

- `private.current_role() returns app_role`: reads `(select auth.jwt() ->> 'user_role')`, defaulting to `'patient'`.
- `private.is_admin() returns bool`: `current_role() = 'admin' and (select auth.jwt()->>'aal') = 'aal2'`.
- `private.my_provider_id() returns uuid`: `select id from public.providers where user_id = (select auth.uid())`.
- `private.is_listed(provider_id) returns bool`: checks `provider_search.listable and (grace_until is null or grace_until > now())`.
- `private.refresh_provider_search(provider_id)`: recomputes the row. It's called by triggers on the source tables.
- `private.audit(action, entity_type, entity_id, diff)`: inserts into `audit_log` using `auth.uid()` and the role.
- `public.custom_access_token_hook(event jsonb)`: adds `user_role`. Execute is granted **only** to `supabase_auth_admin`.
- `public.search_providers(...)`: see [5.6](#56-search-design-fast-filterable-close-enough). `security invoker`, and granted to `anon, authenticated`.

### 7.5 Triggers

- `on_auth_user_created`: creates `profiles` and `user_roles` (role from `raw_user_meta_data->>'signup_role'`, restricted to patient or provider). For providers it also creates a `providers` draft row with `slug = null`.
- `providers_guard` (BEFORE UPDATE): blocks the owner from changing `status`, `verified_*`, `user_id` or `slug` once it's set (defense on top of column grants). Slug is set by an action on first publish.
- `session_requests_transition` (BEFORE UPDATE): enforces the state machine:
  - Provider: `new→viewed→accepted|declined`, `accepted→closed`.
  - Patient: `new|viewed→withdrawn`.
  - It writes `session_request_events` and `audit_log` and stamps timestamps. Any other column change by a non-owner raises an error.
- `refresh_search_*`: after insert/update/delete on `providers`, `provider_terms`, `provider_locations`, `provider_licenses` and `subscriptions`.
- `audit_*`: on `user_roles`, `providers.status`, `provider_documents.status`, `subscriptions.status`, `posts.status`.

### 7.6 RLS policy outline

Every policy names its role. `X` means the action is allowed.

| Table | anon | patient (authenticated) | provider (owner) | admin (aal2) | service (secret key) |
|---|---|---|---|---|---|
| `profiles` | – | select/update own | select/update own | select all | all |
| `user_roles` | – | select own | select own | select all, update (audited) | all |
| `taxonomy_terms` | select active | select | select | all | all |
| `zip_centroids` | select | select | select | all | all |
| `providers` | select where `private.is_listed(id)` | same | select/insert own. Update own via **column grant** (profile fields only). | select all, update status | all |
| `provider_private` | – | – | select/update own | select | all |
| `provider_terms`, `provider_licenses` | select if listed | select if listed | all own (licenses: `verified` not writable by owner) | all | all |
| `provider_locations` | select if listed, **column grant excludes `street`** | same | all own | all | all |
| `provider_documents` | – | – | insert/select own; delete own while draft or changes_requested | select, update status | all |
| `verification_reviews` | – | – | select own (note_to_provider only, via view or column grant) | all | all |
| `provider_search` | select (search RPC) | select | select own | select | all (writes only via the security-definer refresh) |
| `billing_customers`, `subscriptions` | – | – | select own | select | **writes only here** (webhook) |
| `stripe_events`, `email_outbox`, `search_logs`, `analytics_events` | – | – | – | select | **all** |
| `provider_stats_daily`, `provider_keyword_stats_weekly` | – | – | select own (keywords: `impressions >= 5` in policy) | select | all |
| `saved_providers` | – | select/insert/delete own (insert only if listed) | select count only (via stats, not rows) | select | all |
| `session_requests` | – | select own; insert own (`status='new'`, provider listed, rate-limited in the action); update own status (trigger-enforced) | select where `provider_id = my_provider_id()`; update `status, provider_note` (column grant + trigger) | select | all |
| `session_request_events` | – | select for own requests | select for own requests | select | all |
| `posts` | select `published` | same | all own except setting `published` directly when moderation is on | all | all |
| `audit_log` | – | – | – | select | insert (via `private.audit`); **no update/delete grants for anyone** |
| `storage.objects` | `provider-media`: select | `provider-media`: select | own folder in both buckets (see [5.7](#57-file-storage)) | `license-docs` select | all |

Grants hygiene:

- `revoke all on all tables in schema public from anon, authenticated`, then grant explicitly per table and column.
- `revoke execute on all functions in schema public from public, anon`, then grant per RPC.
- The `private` schema is not in the Data API's exposed schemas.

### 7.7 Scheduled jobs

| Job | Where | Schedule | Purpose |
|---|---|---|---|
| `rollup_analytics` | pg_cron (SQL) | hourly | Events into daily and weekly stats. Idempotent upsert for the last 48 hours. |
| `purge_raw_events` | pg_cron | daily | Delete `analytics_events` older than 90 days and `search_logs` older than 12 months. |
| `expire_requests` | pg_cron | daily | `new|viewed` older than 21 days become `expired` (decision). Notifications queue to the outbox. |
| `license_expiry_watch` | pg_cron | daily | Flag licenses expiring within 30 days for the admin queue. |
| `visibility-sweep` | Vercel Cron, `/api/cron/visibility-sweep` | hourly | Revalidate profile tags whose `grace_until` passed. Queue "grace ends tomorrow" and "listing hidden" emails. |
| `stripe-reconcile` | Vercel Cron | daily | Re-sync subscriptions changed in the last 48 hours. |
| `drain-outbox` | Vercel Cron | every 5 min | Retry failed emails with backoff. Mark dead after 5 attempts and alert Sentry. |

Vercel Cron routes check `Authorization: Bearer ${CRON_SECRET}`.

---

## 8. Build order: vertical slices (one Claude Code session each)

Each slice ends merged to `main` with a green CI run and a verified Vercel preview. A slice's spec lives in `docs/specs/slice-NN-*.md` (template in [section 10](#10-working-efficiently-with-claude-code)). AC means acceptance criteria.

### Slice 0: Foundations, hygiene, security fixes

- **Scope:**
  - Commit or stash the pending work.
  - Upgrade `next`, `eslint-config-next` and React patches. Add `typecheck`, `test`, `test:e2e`, `db:start|reset|diff|types|test` scripts.
  - `supabase init`. Local stack runs.
  - `src/lib/env.ts`. The four Supabase clients. `src/proxy.ts` (session refresh only, no redirects yet).
  - Sentry wiring. Security headers. Vercel Analytics in `(site)` only.
  - Move Decap to `/cms` and fix the OAuth callback (origin check plus `state`).
  - Upstash limit and a honeypot on `/api/contact`.
  - Vitest and Playwright scaffolding with a home-page smoke test.
  - GitHub Actions running lint, typecheck, unit, `supabase test db` and e2e smoke against `next build && next start`.
  - Write `CLAUDE.md`. Try `cacheComponents: true`.
- **AC:**
  - `npm run build` passes with no type errors.
  - Every marketing page renders identically (Playwright screenshot diff on home, how-it-works, blog and contact at 390 and 1280 widths).
  - Proxy doesn't run on static assets (checked through the matcher).
  - `/admin` no longer serves Decap. `/cms` does, and the OAuth popup rejects foreign origins (unit test of the handshake page).
  - The contact endpoint returns 429 after 5 requests per hour.
  - A Sentry test error appears with no PII.
  - CI is green on the PR, and the preview deploy works.

### Slice 1: App design-system primitives and shells

- **Scope:**
  - Rework `input` and `card`.
  - Add the components from the table in [section 6](#6-folder-and-route-structure).
  - `components/app/{app-shell, app-nav, page-header, empty-state, status-badge, stat-tile, step-wizard}`.
  - `/dev/ui` kitchen sink. Sonner `<Toaster/>` in the root layout.
- **AC:**
  - Every component renders on `/dev/ui` in default, hover, focus-visible, disabled, invalid and loading states.
  - axe finds 0 serious or critical violations on `/dev/ui`.
  - Keyboard: dialog, sheet and select trap focus and return it on close.
  - No arbitrary px values in new files (a grep check in CI).
  - Login page visual diff is approved.
  - The shells work at 375 px (nav becomes a sheet) and 1280 px.

### Slice 2: Schema v1, RLS, roles, seed, pgTAP

- **Scope:**
  - Declarative schema files for all of [section 7](#7-database-schema-sketch) except posts and analytics. Those land in their own slices, though the enums are created now.
  - Helper functions, triggers, the access-token hook (`config.toml`), buckets, and generated types.
  - Seed generator: taxonomy, ZIP subset, 1 admin, 10 patients, 50 providers.
  - pgTAP RLS tests per table.
- **AC:**
  - `supabase db reset` runs schema, seed and tests green.
  - pgTAP proves, for each table and role, the allowed and denied select, insert, update and delete cases. That includes: anon can't read an unlisted provider or a `street` column. Patient A can't read patient B's requests. A provider can't change `status`. Nobody can update or delete `audit_log`.
  - `database.types.ts` is generated and committed. Types compile.
  - The JWT contains `user_role` for seeded users.

### Slice 3: Auth

- **Scope:**
  - Move `/login` into `(auth)`, keeping its look and copy. Make the form real with RHF, Zod and a server action.
  - `/signup` (patient default, `?role=provider`), `/check-email`, `/auth/confirm`, `/forgot-password`, `/reset-password`, logout.
  - Magic-link option. Role-based redirects in proxy and the DAL.
  - Resend SMTP. React Email auth templates exported to `supabase/templates`.
  - Rate limits on sign-up and OTP. Admin MFA enrollment page.
- **AC (Playwright, using Mailpit to read emails):**
  - Patient sign-up, then the confirm link, then landing on `/account`.
  - Provider sign-up, then landing on `/provider/onboarding/1`.
  - Wrong password shows an inline error.
  - Magic link logs in, and also works when opened in a different browser context (token_hash flow).
  - Reset password completes the full cycle.
  - Visiting `/provider` as a patient redirects to `/account`. `/admin` without aal2 goes to the MFA challenge.
  - Every page has loading (pending button), error and success states, and works at 375 px.
  - Email text contains no data beyond the link.

### Slice 4: Provider onboarding wizard (4a) and license upload (4b)

These may be split into two sessions.

- **Scope:** steps
  1. Basics (name, credentials, pronouns, profession, photo)
  2. Practice (formats, location with ZIP to centroid, plus street, which stays private)
  3. Clinical focus (specialties, approaches, age groups, languages, chip multi-selects)
  4. Fees (range, sliding scale, accepting new clients)
  5. Licenses (rows per state, type, number, expiry, compact) plus document upload
  6. Review and submit (sets `status='submitted'`, emails the admin)

  Autosave per step, with resume from the furthest incomplete step and a progress stepper.
- **AC:**
  - Each step validates client-side and server-side with the same Zod schema.
  - Refresh mid-wizard restores the data.
  - Uploading a 12 MB file or a .docx shows an inline error. A valid PDF shows progress, then its file row.
  - Another provider can't read the file (pgTAP storage test plus e2e attempt).
  - Submit locks editing of licenses and documents until a decision.
  - Mobile at 375 px works throughout. Every field has a label and an error message wired to `aria-describedby`.

### Slice 5: Admin verification queue

- **Scope:**
  - `/admin/verifications` table (filters: submitted, in review, changes requested; sorted oldest first; SLA age).
  - Detail page: profile summary, licenses, documents (60-second signed URL with an audit entry), and links to state license lookup sites as plain links.
  - Actions: approve, request changes (note to provider), reject, suspend. Each decision is audited and emailed.
- **AC:**
  - Only an aal2 admin can see the queue (e2e for patient, provider and admin without MFA).
  - Approve sets `verified_at` and `status='approved'` and emails the provider. The provider dashboard reflects it.
  - Request-changes reopens the wizard with the admin note shown.
  - Each document view creates an `audit_log` row.
  - Empty queue shows the empty state. A failing action shows an error toast and leaves the row unchanged.

### Slice 6: Stripe billing, grace period, listing visibility

- **Scope:**
  - Product and price setup script.
  - Checkout action, Portal action, webhook, `subscriptions` sync, grace logic and the listable computation.
  - Provider status banner (not verified, not subscribed, past due with a countdown, hidden).
  - Billing page. Emails. Reconcile and visibility-sweep crons.
- **AC:**
  - Checkout with test card 4242 makes the provider `listable` within seconds of the webhook.
  - A duplicate webhook delivery is a no-op.
  - Out-of-order events end in the correct state (re-fetch strategy unit-tested with mocked Stripe).
  - With a test clock: a failed renewal gives `past_due` and a banner with "3 days left". Advancing 3 days hides the provider from search (SQL check). Paying restores visibility.
  - Portal cancel at period end keeps the listing until `current_period_end`.
  - Webhook rejects bad signatures with 400.

### Slice 7: Profile editor with live preview, and public profile

- **Scope:**
  - `/provider/profile`: an editor form on the left and a live preview on the right that reuses the **same** public profile components (desktop). Mobile uses an Edit/Preview tab toggle.
  - Publish and unpublish. Slug generation.
  - `/providers/[slug]` public page modeled on the `how-it-works` profile showcase (real data), with `use cache` and cacheTag, SEO metadata, and an OG image (no health claims).
  - Unlisted or hidden profile shows an "unavailable" page (decision).
- **AC:**
  - Typing updates the preview within 1 frame with no network round trip.
  - Publish shows the change on the public page immediately (`updateTag`).
  - Unlisted provider gives 404 or "unavailable".
  - Public HTML contains no street address, phone or NPI (test).
  - Lighthouse on the public profile: Performance ≥ 90 and Accessibility ≥ 95 on mobile.

### Slice 8a: Search engine (SQL)

- **Scope:** `provider_search` refresh logic, `search_providers` RPC with scoring and `missed[]`, ZIP lookup, `search_logs` insert, a 5k-row synthetic seed for performance testing, and pgTAP plus SQL performance tests.
- **AC:**
  - Golden-file tests over the seeded data: exact matches rank first. The relaxed tier appears only when exact results number fewer than 10. Online results honor license states. Radius is respected. `missed` reasons are correct.
  - `explain analyze` p95 under 50 ms on 5k rows.
  - Unlisted and grace-expired providers never appear.

### Slice 8b: Search UI

- **Scope:**
  - `/providers` page: filter bar on desktop, filter sheet on mobile, result cards (reusing the profile card language from `verified-providers`), "Close matches" section with reasons, pagination, and empty, loading and error states.
  - nuqs parsers shared with the server.
  - Home hero search wired to `/providers` (no visual or copy change).
  - Impression logging via `after()`.
- **AC:**
  - Every filter round-trips through the URL (back and forward buttons work).
  - Shared URL reproduces the results.
  - No free-text input in the URL.
  - 375 px usable with the sheet.
  - Server TTFB p95 under 200 ms on preview with the seed.
  - Impressions rows written once per result render.
  - axe clean. Filter chips announce their state.

### Slice 9: Patient saves and patient dashboard

- **Scope:** save/unsave heart on cards and profiles (optimistic with `useOptimistic`), `/account` overview, `/account/saved`, settings (name, email change, delete account request).
- **AC:**
  - An anonymous save prompts login and returns to the same profile.
  - Optimistic toggle rolls back on error with a toast.
  - Saved list has an empty state.
  - Save and unsave events are recorded.
  - RLS e2e: patient B's saved list can't be read.

### Slice 10: Session requests

- **Scope:**
  - Request form on `/providers/[slug]/request` (patient only; format, state, availability, payment preference, optional short message with a "don't include sensitive details" hint, contact details prefilled). The crisis notice reuses the existing `CrisisCard` (copy as-is).
  - Rate limit. PHI-free email to the provider with a "View request" link.
  - Provider inbox `/provider/requests` (tabs by status, unread dot), detail with status actions and a private note.
  - Auto-mark `viewed` on open.
  - Patient timeline `/account/requests/[id]` showing status history. Status-change email to the patient (PHI-free).
- **AC:**
  - Full loop in e2e: patient submits, the provider email arrives (Mailpit) with only a link, the provider opens it (status becomes `viewed`, visible to the patient), the provider accepts, and the patient sees "Accepted" with a timeline entry.
  - Illegal transitions are rejected by the trigger (pgTAP).
  - A sixth request in an hour returns a rate-limit error.
  - A provider can't see another provider's requests (pgTAP and e2e).
  - Email HTML snapshot contains no message text or patient name.

### Slice 11: Provider analytics

- **Scope:** `/api/events` beacon route, `<TrackView/>`, rollup pg_cron, `/provider/analytics` with stat tiles, line chart, keyword bars (k ≥ 5) and conversion, and a 90-day synthetic events seed.
- **AC:**
  - Tiles match SQL truth for the seeded data.
  - Keyword terms under the threshold are hidden.
  - The provider's own views are excluded.
  - Beacon spam is rate-limited.
  - Charts have text alternatives (a summary table for screen readers).
  - Empty state for new providers.
  - No IP stored anywhere (schema test).

### Slice 12: Provider blog posts

- **Scope:** `/provider/posts` list and editor (Tiptap), image upload, draft, submit for review, admin approve, publish. Public rendering merged into `/blog` and the provider profile's "Articles" section. Sanitization tests.
- **AC:**
  - `<script>` and `javascript:` links are stripped (unit tests).
  - The editor works by keyboard.
  - Published post shows on `/blog` and the profile.
  - Unpublish removes it (tag revalidation).
  - Company markdown posts are unaffected.

### Slice 13: Hardening and launch

- **Scope:**
  - Full axe sweep. Keyboard pass. Lighthouse budgets.
  - Security review (Claude `/security-review` plus a manual RLS audit using only the publishable key from a second account).
  - Header and CSP verification. Backups/PITR decision. Sentry alerts.
  - Runbook (`docs/runbook.md`): rotate keys, replay webhooks, restore DB.
  - Optional items: Google OAuth, migrate company posts to the DB and delete Decap and the GitHub OAuth routes, and `use cache: remote` if needed.
- **AC:** zero critical findings open. Launch checklist signed off by the client (privacy policy and cookie policy alignment with actual data flows: copy changes are the client's to approve).

---

## 9. Definition of done (every slice)

- [ ] **Spec followed.** Out-of-scope items are logged as follow-ups, not built.
- [ ] **Types:** `npm run typecheck` is clean. No `any` or `@ts-ignore` without a comment. DB types regenerated after schema changes.
- [ ] **Lint:** `npm run lint` is clean. Import rules hold: the `admin.ts` client only in api and jobs, and `server-only` in DAL modules.
- [ ] **Tests:**
  - Unit tests for schemas and pure logic.
  - pgTAP for every new table, policy, trigger and RPC (allow **and** deny cases per role).
  - A Playwright smoke spec for the slice's main flow (desktop and 375 px).
- [ ] **All UI states:**
  - Loading (skeleton or pending button).
  - Empty (EmptyState with an action).
  - Error (inline field errors, toast for action errors, `error.tsx` boundary).
  - Success (toast or redirect).
  - Unauthorized (redirect).
  - Not found.
- [ ] **Mobile:** works at 375 px with no horizontal scroll, touch targets of at least 44 px, sheets instead of side panels.
- [ ] **Accessibility:**
  - axe has 0 serious or critical issues.
  - Labels on every input, errors linked through `aria-describedby`.
  - Focus visible and returned after dialogs.
  - Status not conveyed by color alone.
  - Reduced-motion respected.
  - Headings in order using `type-*` roles.
- [ ] **Security and privacy:**
  - RLS enabled with tests.
  - Server Actions use `createAction` with a schema and role.
  - Rate limit on any write a stranger can trigger.
  - No PHI in emails, URLs, logs, Sentry or analytics.
  - New third-party origins added to the CSP deliberately.
- [ ] **Design system:**
  - Only tokens and `type-*` roles. New primitives live in `components/ui` and on `/dev/ui`.
  - Marketing copy unchanged.
  - New microcopy listed in the PR for client review.
- [ ] **Performance:** no client component where a server component works. Charts and editor lazy-loaded. Images through `next/image`.
- [ ] **Docs:** spec updated with decisions. `CLAUDE.md` updated if a convention changed. Env vars added to `.env.local.example`.
- [ ] **Preview verified:** Vercel preview plus Supabase branch deploys. Smoke test passes against the preview URL.

---

## 10. Working efficiently with Claude Code

### 10.1 `website/CLAUDE.md` outline

1. **Project summary (5 lines):** PsychMind is a US mental-health provider directory with three roles. Sensitive health data. Marketing copy is client-approved.
2. **Commands:** `npm run dev | build | lint | typecheck | test | test:e2e`, `npm run db:start | db:reset | db:diff -- <name> | db:types | db:test`, `stripe listen …`, and the Mailpit URL.
3. **Architecture map:** the folder tree from [section 6](#6-folder-and-route-structure) in 15 lines, plus "where does X go?":
   - Page code: `app/`
   - Feature logic: `features/<name>/`
   - Infrastructure: `server/`
   - Primitives: `components/ui`
   - Compositions: `components/app`
4. **Non-negotiable security rules:**
   - Every table has RLS and pgTAP tests.
   - Every mutation uses `createAction` (schema + role + rate limit).
   - Never import `lib/supabase/admin` outside `app/api/**` and `server/jobs/**`.
   - Use `getClaims()`, never `getSession()`, on the server.
   - Proxy is not authorization.
   - No PHI in emails, URLs, logs, Sentry or analytics. No third-party scripts or pixels.
   - Never commit secrets or read `.env.local` contents into chat.
5. **Data rules:**
   - Edit `supabase/schemas/*.sql`, then run `db:diff`, review the migration and run `db:types`.
   - DML, RLS `alter policy` and grants go in hand-written migrations (the diff tool misses them).
   - Never edit `database.types.ts` or applied migrations.
   - Roll forward only.
6. **Design-system rules:**
   - Tokens and `type-*` roles only. No arbitrary values.
   - Reuse `Button`, `Tag`, `Section`/`Container`.
   - New primitives go in `components/ui` with cva, `data-slot` and a `/dev/ui` entry.
   - App shells have no Lenis or GSAP.
   - **Do not change marketing copy.** Flag issues instead.
   - New app microcopy gets listed in the PR.
7. **Next 16 rules:**
   - `proxy.ts`, not middleware.
   - Async `params`/`searchParams`/`cookies()`.
   - `'use cache'` only with the `public` client.
   - `revalidateTag(tag,'max')` in webhooks, `updateTag` in actions.
   - `after()` for side effects.
   - Layouts don't guard.
8. **Forms:** the RHF + Zod pattern, with a snippet, `applyActionErrors`, and the shared schema in `features/*/schemas.ts`.
9. **Testing:** what each layer covers, how to run against local Supabase, and the seeded test users. Credentials live in `supabase/seed/README.md`. They are test-only and never real.
10. **Definition of done:** a link to [section 9](#9-definition-of-done-every-slice), copied into `docs/definition-of-done.md`.
11. **Workflow:**
    - Read `docs/specs/slice-NN.md` first.
    - Plan, then implement, then run tests, then self-review with `/code-review`, then `/security-review` for auth, RLS or payment slices.
    - One slice per branch (`slice/NN-name`) and PR.
    - Stop and ask when the spec is ambiguous or a client decision is needed.

Add `.claude/settings.json` permissions:

- **Allow:** `npm run *`, `npx supabase *` (except `db push`/`link`), `npx playwright *`, `stripe listen|trigger`.
- **Deny:** `supabase db push`, `vercel --prod`, reading `.env*`, and `git push --force`.

Production deploys happen only through merge to `main`.

### 10.2 Spec per slice (`docs/specs/slice-NN-name.md` template)

```
# Slice NN — <name>
Goal (1–2 sentences) · Users/roles affected
User stories (As a … I can … so that …)
Routes & files to touch (new/changed)
Data: tables/columns/enums/RPCs (+ migration name) · RLS changes (allow/deny matrix rows)
UI: screens, components (existing ui/* to reuse, new primitives), states (loading/empty/error/success/unauthorized), mobile notes, a11y notes
Emails (template, trigger, PHI-safe payload) · Analytics events
Rate limits · Audit events
Acceptance criteria (numbered, testable) → mapped to test names (pgTAP / unit / Playwright)
Out of scope · Open questions (client decisions) · New microcopy for client review
```

Write the spec in a short planning session, or have Claude draft it from this document, then review it before the build session. Keep each spec under about 150 lines so it fits comfortably in context with the code.

### 10.3 Seed data (`scripts/seed/generate.ts` writes `supabase/seed.sql`)

- **Deterministic:** faker with a fixed seed. Regenerate with `npm run db:seed:gen`.
- **Users** (password set in the seed file, documented as test-only):
  - 1 admin with MFA factor pre-enrolled for e2e (or an e2e bypass flag that only exists locally)
  - 10 patients
  - 50 providers
- **Providers:**
  - Spread across about 8 metros (Miami, Boston, Chicago, Austin, Denver, Seattle, Atlanta, NYC), plus 6 online-only.
  - Realistic mixes of professions (psychologist, LPC/LMHC, LCSW, LMFT, PMHNP), specialties, approaches, languages (English plus about 25% Spanish and a few others), genders, age groups, and fees from $80 to $250 with some sliding scale.
  - Status mix: 30 approved, listed and active. 4 past_due within grace. 2 past_due with grace expired. 3 canceled. 5 submitted. 3 changes_requested. 3 draft.
- **Licenses:** home state plus a few compact privileges, with some expiring within 30 days.
- **Photos:** neutral generated avatars (initials or illustrated) in `provider-media`. Don't reuse the Unsplash stock faces for fake clinicians, since `photos.ts` already flags consent.
- **Requests:** across all statuses. Saved providers. 90 days of synthetic analytics events.
- **Taxonomy:** the full lists for specialties, approaches, languages, age groups and professions. Draft them, then **send them to the client for approval** as content.
- **ZIP centroids:** a subset for the seed metros. The full Census file loads in production through `scripts/geo/load-zcta.ts`.
- **Stripe:** subscription rows use fake IDs (`sub_seed_…`). E2E billing tests create real test-mode objects.

### 10.4 Playwright smoke tests per slice

- **Projects:** `chromium-desktop` (1280) and `mobile` (Pixel or iPhone emulation, 390).
- **Global setup:** `supabase db reset` once per CI run. Log in each seeded role and save `storageState` (patient, provider-approved, provider-draft, admin).
- **Helpers:** `mailpit.latestLinkFor(email)` reads auth and transactional emails. `stripe.triggerWebhook` and test-clock helpers cover billing.
- **One file per slice** (`tests/e2e/slice-NN-*.spec.ts`) with 1 to 3 happy paths plus 1 permission-denial check. Tag `@smoke` for the preview run.
- **Accessibility:** `@axe-core/playwright` check on each new page within the smoke spec.
- **Run locations:** locally against `next build && next start` (not dev) and in CI. After deploy, run `@smoke` against the Vercel preview URL with the `x-vercel-protection-bypass` header.

### 10.5 Environments and preview deployments

| Env | Vercel | Supabase | Stripe | Email |
|---|---|---|---|---|
| Local | `next dev` | `supabase start` (Docker) + Mailpit | test mode + `stripe listen` | Mailpit (auth) and Resend test key or console sink |
| Preview (per PR) | Preview deploy | **Supabase Branching** via the GitHub integration (migrations and seed per branch, env vars synced to Vercel preview, redirect URLs updated). Cost is about $0.013 per branch-hour. | test mode, webhook endpoint per preview, or forward from a fixed staging URL | Resend test key, restricted to team inboxes |
| Production | `main` | Production project, migrations applied on merge by the integration | live mode | Resend, verified domain |

**Branching notes:**

- Env vars sync when the PR opens, and Supabase may redeploy the preview to win the race.
- If branching costs or complexity bite, fall back to one shared `staging` Supabase project for all previews.
- Vercel Deployment Protection stays on for previews.

### 10.6 Session hygiene with Claude Code

- Start each session with the spec, `CLAUDE.md`, and the relevant part of this document (sections 5 to 7), not the whole repo.
- Mark chapters: plan, schema/RLS, UI, tests, review.
- Ask Claude to write pgTAP and Playwright tests **before** the UI for security-sensitive slices (2, 3, 6, 10).
- Use the Supabase MCP server (if desired) in **read-only mode, scoped to the local or dev project only**. Never connect it to production.
- End every slice with `/code-review`, and with `/security-review` for slices 0, 2, 3, 5, 6, 10 and 12.
- Keep a running `docs/decisions.md` (ADR-lite): one line per decision with date and reason.

---

## 11. Cost at MVP scale (monthly, verify before budgeting)

| Item | Standard mode | HIPAA mode (if counsel requires) |
|---|---|---|
| Vercel Pro | about $20 per seat, plus Web Analytics events at $0.03 per 1k | + BAA $350 |
| Supabase | Pro $25 (includes $10 compute credit, 100k MAU, 8 GB DB, 100 GB storage) + branching about $0 to $10 | Team $599 + HIPAA add-on (unpublished, about $350 reported) + PITR $100 |
| Resend | Free tier to start, paid tier as volume grows (verify) | Keep PHI out, or a BAA email vendor |
| Upstash | Free (500K commands a month) | same |
| Sentry | Free developer tier to start (verify) | Business tier for the BAA (optional if no PHI is sent) |
| Stripe | 0.7% Billing + card processing, per transaction | same |
| **Total fixed** | **about $70 to $110** (one or two Vercel seats, Supabase Pro, free tiers elsewhere) | **about $1.4k to $1.6k** |

---

## 12. Open questions for the client

1. **HIPAA / BAA:** does counsel consider PsychMind a business associate or subject to HIPAA? This decides standard vs HIPAA mode ([section 11](#11-cost-at-mvp-scale-monthly-verify-before-budgeting)). Also needed: consumer-health-data consent text for Washington and similar states. Privacy policy copy is the client's to approve.
2. **Provider pricing:**
   - Monthly price, trial (yes/no and length), annual plan later?
   - Charge before or after verification? Recommended: after.
3. **Hidden profiles:** after grace, hide only from search (per the brief), or also make the profile page unavailable? Recommended: unavailable, with requests disabled.
4. **Copy promises outside the MVP:**
   - "Message before request": add messaging, or keep request-only?
   - Insurance filter: add an `insurance_carriers` taxonomy and filter?
   - "Continue with Google": in or out at launch?
   - "Search thousands of verified psychologists": the launch supply is 100 to 500.

   No copy will be changed without approval.
5. **Request details:** required fields, the message length cap, auto-expiry after N days, and whether the patient's contact details are revealed to the provider before or after "Accepted".
6. **Blog moderation:** do provider posts need admin approval before publishing? Recommended: yes.
7. **Taxonomy:** approve the lists for professions, specialties, approaches, languages, age groups and genders.
8. **Address privacy:** show city, state and ZIP only (recommended) or the full street address for in-person providers?
9. **Launch geography:** which states first? This affects the licensure and compact modeling and the seed.
10. **Retention periods:** analytics 90 days raw, search logs 12 months, requests 24 months. Confirm or adjust.

---

## 13. Sources

Next.js 16 (also bundled locally in `website/node_modules/next/dist/docs`, v16.2.12):
- Proxy (middleware renamed, Node runtime only, matcher): https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Version 16 upgrade guide (`revalidateTag(tag, profile)`, `updateTag`, `refresh`, `cacheComponents`, proxy rename, Node 20.9+): https://nextjs.org/docs/app/guides/upgrading/version-16
- `cacheComponents`: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
- `use cache` (no cookies/headers inside; serverless runtime cache behavior): https://nextjs.org/docs/app/api-reference/directives/use-cache
- `use cache: remote` / `use cache: private`: https://nextjs.org/docs/app/api-reference/directives/use-cache-remote
- `after`: https://nextjs.org/docs/app/api-reference/functions/after
- Authentication guide (DAL, optimistic checks in Proxy, layouts don't re-render): https://nextjs.org/docs/app/guides/authentication
- Data security (DAL, DTOs, `server-only`, taint): https://nextjs.org/docs/app/guides/data-security
- Forms (Server Actions + Zod + `useActionState`): https://nextjs.org/docs/app/guides/forms
- Testing guide: https://nextjs.org/docs/app/guides/testing

Supabase:
- Server-side auth for Next.js (`proxy.ts` on 16+, `getClaims`, publishable key env, Set-Cookie caching warning): https://supabase.com/docs/guides/auth/server-side/nextjs
- New API keys (publishable/secret; legacy keys retired late 2026): https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys and https://supabase.com/changelog/29260-upcoming-changes-to-supabase-api-keys
- RLS (`(select auth.uid())`, `to authenticated`, indexes, security definer, app_metadata vs user_metadata): https://supabase.com/docs/guides/database/postgres/row-level-security
- Custom claims and RBAC: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- Custom Access Token Hook: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- PostGIS: https://supabase.com/docs/guides/database/extensions/postgis
- Storage signed URLs / signed upload URLs: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl and https://supabase.com/docs/reference/csharp/storage-from-createsigneduploadurl
- Passwordless (magic link, `shouldCreateUser`, PKCE same-browser): https://supabase.com/docs/guides/auth/auth-email-passwordless
- `verifyOtp` with token_hash: https://supabase.com/docs/reference/javascript/auth-verifyotp
- Custom SMTP and auth rate limits: https://supabase.com/docs/guides/auth/auth-smtp and https://supabase.com/docs/guides/auth/rate-limits
- Declarative schemas (`supabase/schemas`, `db diff`, limitations): https://supabase.com/docs/guides/local-development/declarative-database-schemas
- Type generation: https://supabase.com/docs/guides/api/rest/generating-types
- Testing (pgTAP, `supabase test db`): https://supabase.com/docs/guides/local-development/testing/overview ; basejump helpers: https://database.dev/basejump/supabase_test_helpers
- Cron: https://supabase.com/docs/guides/cron ; Queues: https://supabase.com/docs/guides/queues
- Branching with Vercel: https://supabase.com/docs/guides/deployment/branching/integrations
- Pricing (Pro $25, Team $599, branching $0.01344/h, PITR $100, HIPAA add-on on Team): https://supabase.com/pricing

Compliance:
- Vercel HIPAA BAA on Pro (2025-09-09): https://vercel.com/changelog/hipaa-baas-are-now-available-to-pro-teams ; Pro plan add-on pricing: https://vercel.com/docs/plans/pro-plan
- Supabase HIPAA cost reports (third-party): https://www.rapidevelopers.com/md/compliance/is-supabase-hipaa-compliant
- Resend BAA status (competitor claim, unverified): https://docs.paubox.com/email-api/migrate-from-resend
- Sentry BAA (Business+): https://sentry.io/legal/baa ; Next.js data collected / `sendDefaultPii`: https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/data-collected/
- FTC Health Breach Notification Rule amendments (2024): https://www.hoganlovells.com/en/publications/ftc-finalizes-revised-health-breach-notification-rule-expanding-its-scope-and-updating-companies-obligations
- Washington My Health My Data Act: https://www.jonesday.com/en/insights/2023/04/my-health-my-data-washington-enacts-first-state-comprehensive-health-privacy-law
- Telehealth licensure / compacts (2026 status): https://www.triadhq.com/blog/telehealth-across-state-lines-2026 ; https://psypact.gov ; https://counselingcompact.gov
- Neon HIPAA (third-party): https://frontdeskreview.com/software/managed-postgres/neon/

Stripe:
- Subscription webhooks and statuses (revoke on `unpaid`/`canceled`, `invoice.paid` provisioning, retries up to 3 days): https://docs.stripe.com/billing/subscriptions/webhooks
- Smart Retries: https://docs.stripe.com/billing/revenue-recovery/smart-retries
- Billing pricing (0.7%) and Customer Portal: https://support.stripe.com/questions/billing-self-serve-portal and https://stripe.com/billing/pricing
- `stripe` npm 23.0.0 pins API version `2026-09-30.endive` (read from the package's `apiVersion.js`, 2026-10-07).

Libraries:
- nuqs server-side cache and adapters (v2.10.1): https://nuqs.dev/docs/server-side and https://nuqs.dev/docs/adapters
- Tiptap Next.js install (`immediatelyRender:false`): https://tiptap.dev/docs/editor/getting-started/install/nextjs ; static renderer: https://tiptap.dev/docs/editor/api/utilities/static-renderer ; Tiptap vs Lexical 2026: https://www.pkgpulse.com/guides/tiptap-vs-lexical-vs-slate-vs-quill-rich-text-editor-2026
- shadcn chart (Recharts v3 notes): https://ui.shadcn.com/docs/components/chart ; Base UI default, Radix still supported (July 2026): https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- React Email 5 (Tailwind 4, Next 16) and 6 (single package): https://resend.com/blog/react-email-5 and https://resend.com/blog/react-email-6
- Forms comparison 2026: https://www.pkgpulse.com/guides/best-react-form-libraries-2026 ; Zod 4: https://zod.dev/v4
- Upstash ratelimit algorithms: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms ; pricing: https://upstash.com/pricing/redis
- Sentry Next.js manual setup: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup ; Turbopack support: https://blog.sentry.io/turbopack-support-next-js-sdk
- Vercel Web Analytics privacy and pricing: https://vercel.com/docs/analytics/privacy-policy and https://vercel.com/docs/analytics/limits-and-pricing
- Vitest 5 (Node 22.12+): https://vitest.dev/blog/vitest-5 ; Playwright release notes: https://playwright.dev/docs/release-notes
- Auth alternatives (Better Auth / Clerk / Supabase Auth, 2026): https://makerkit.dev/blog/tutorials/better-auth-vs-clerk ; Neon Auth (Better Auth-based, beta): https://neon.com/docs/auth/overview
- Census Gazetteer ZCTA file: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2024.html

Package versions in [section 4](#4-recommended-stack-and-versions) come from `npm view <pkg> version` on 2026-10-07.
