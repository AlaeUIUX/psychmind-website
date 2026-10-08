# PsychMind: working notes for Claude Code

PsychMind is a US directory that connects people with licensed mental-health providers. This repo holds the marketing site (live at psychmind.org) and the app being built in vertical slices.

- **The plan:** `docs/build-plan/BUILD-PLAN.md`. Research behind it is in `docs/build-plan/research/`.
- **One slice per session.** Before building, copy the slice into `docs/specs/slice-NN-name.md`.

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
  - `role` is `patient`, `provider` or `admin`. Admins come from `ADMIN_EMAILS`.
  - API notes: `docs/build-plan/research/better-auth-stripe-cheatsheet.md`.
- **Database:** Drizzle ORM on Postgres. The schema is in `src/db/schema`; migrations are in `drizzle/`.
  - `npm run db:generate` creates a migration; `npm run db:migrate` applies it to `DATABASE_URL`. On Vercel, `npm run build` applies them first (skipped without `DATABASE_URL`).
  - Without `DATABASE_URL`, local dev uses **PGlite** in memory, snapshotted to `.data/pglite.tar.gz`. Delete that file to reset.
- **Billing:** the Better Auth Stripe plugin, loaded only when `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_PRICE_BASE` are set.
  - Listing and grace rules: `src/lib/billing.ts`.
- **Email:** `src/server/email.ts` sends through Resend, or writes to the local outbox at `/dev/mail` when `EMAIL_TRANSPORT=outbox` or when there's no key.
- **Uploads:** `/api/uploads` and `/api/files/[id]` check ownership and sniff file bytes. Bytes live in `.data/uploads` locally and in the private `file_blob` table on Vercel (`STORAGE_DRIVER`). Supabase Storage replaces that at scale.
- **Forms:** react-hook-form with Zod 4. Use our `zodResolver` in `src/lib/forms`, not `@hookform/resolvers`. Provider sections are shared by the wizard and the editor.
- **Rate limits:** `rateLimit()` uses Upstash when configured, else the `rate_limit_counter` table in Postgres (production), else memory (local). Keys are hashed. Better Auth's own limiter uses the same store (`customStorage`), but it does **not** rate-limit server-side `auth.api` calls, so wrap actions yourself. Sign-in is also limited per account, whatever the IP.
- **Two-step login:** the Better Auth `twoFactor` plugin (authenticator app + 10 backup codes). **Required for admins**: `requireRole("admin")` sends them to `/two-factor/setup`, and admins can't sign in with Google. Any user can turn it on in Settings.
- **Account data:** Settings → "Download your data" (`/api/account/export`, no secrets) and "Delete your account" (password required when the account has one; `server/account/cleanup.ts` cancels billing and deletes files first).
- **CSP:** set in `proxy.ts` (`lib/csp.ts`). Portal pages get a per-request nonce with `'strict-dynamic'`; marketing pages allow `'self' 'unsafe-inline'` scripts. A new third-party script, image host or form target must be added there.

**Planned:** nuqs for URL state, and Supabase for Postgres and Storage.

**Every env var** is documented in `.env.local.example`.

## Hosts

- **The portal** is `app.psychmind.org`; marketing stays on `www`.
- `src/proxy.ts` and `src/lib/hosts.ts` route each request to the right host.
- **Locally**, open the portal at `http://app.localhost:<port>`. `APP_HOST=off` serves it from `localhost` instead, which Google sign-in needs.
- **Vercel previews** serve everything from one host and use the branch URL as the auth origin (`defaultOrigin()`).
- **`/dev/setup`** shows what a deployment has configured and the exact Google redirect URI. The guide is `docs/live-testing.md`.
- **Portal UI** uses the `.app-ui` scope from `globals.css`:
  - Geist `type-ui-*` roles and product-sized controls;
  - squarer radii via `--radius-button`, `--radius-field` and `--radius-card`;
  - `animate-ui-enter` for content as it enters.
- **Auth pages** share a persistent animated panel (`components/auth/portal-panel.tsx`).
- **Onboarding** has its own shell (`components/onboarding`): step rail, save status, and a step-by-step live preview (`step-preview.tsx`). Each step shows its part of the profile at real size, in a browser window that wraps it on the gray paper panel. "Full profile" opens the whole page. Below `xl` the top bar shows the current phase and step instead of all phases.

## Route groups

| Group | Purpose |
|---|---|
| `(site)` | Marketing |
| `(auth)` | Login and sign-up |
| `(patient)` | `/account` |
| `(provider)` | `/provider` |
| `(admin)` | `/admin` |

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
  - `AppShell`: header with nav, avatar menu, mobile sheet and slim footer.
  - `PageHeader`: breadcrumb, title, description.
  - `StatusBanner`: account states with an optional countdown.
  - `EmptyState` and `ErrorState`.
  - `StatTile`, `StepProgress`, `ChoiceChips` (ToggleGroup `chip` variant), `UploadDropzone`.
  - `CrisisStrip`: compact 988.
- **Keyboard shortcuts** use `Kbd` (`components/ui/kbd.tsx`, Geist-style): `<Kbd meta>↵</Kbd>` shows ⌘ on Apple devices and Ctrl elsewhere.
- **Emails** (`server/emails.ts`) share one layout in the landing page's look: serif headline, ink pill button, notepad footer. Images are PNGs in `public/images/email`, since Gmail doesn't show SVG. No tracking pixels.
- **Status colours** use Tailwind's sky (info), emerald (success), amber (warning) and red (danger), always paired with an icon or text. `Badge` has matching variants: `neutral`, `info`, `success`, `warning`, `danger`, `brand`.
- **Gray scale:** the `warm-*` and `text-*` tokens are runtime variables.
  - Marketing pages use Tailwind **stone**; inside `.app-ui` they are Tailwind **zinc**.
  - Keep using `warm-*` classes; the scope decides the values.
  - The portal accent is Tailwind blue-600 (`--ring-accent`); crimson is for marketing calls to action.
- **Never add named spacing tokens** (`--spacing-lg` etc.) to `@theme`. They shadow Tailwind's named sizes, so shadcn's `max-w-lg` once rendered dialogs 12px wide.
- New primitives must appear on `/dev/ui` (the kitchen sink; hidden in production).

## Content

- **Copy is client-approved.** Never reword existing copy or Figma copy.
- New microcopy gets a `TODO(client)` comment and is listed in the PR.
- Flag copy problems instead of fixing them.

## Privacy and security

- **Health context: keep sensitive data out.** No health details, message text or patient names in emails, URLs, logs, Sentry or analytics. No ad pixels in the app.
- **Auth checks in layers:** RLS on every table, plus a role check in the server-only data access layer. The service-role key is used only in webhooks and cron.
- **Rate limits:** every write a stranger can trigger is rate-limited (`rateLimit()`).
- **Data layer checks its own role.** Admin data functions call `requireRole("admin")` themselves; a layout's check alone isn't enough (Next can skip layouts on client navigation).
- **Crisis access:** every patient-facing app screen offers 988.

## Files and encoding

- Files use CRLF line endings. Write UTF-8 and never round-trip files through tools that default to cp1252: Windows Python `open()` without `encoding="utf-8"` once corrupted `—`.
- Prefer the Edit/Write tools, or Node with `utf8`, for scripted edits.
