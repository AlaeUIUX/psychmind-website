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

Planned:
- Supabase: Postgres with PostGIS, Auth and Storage.
- Stripe Billing.
- nuqs for URL state.
- react-hook-form + Zod.
- Upstash for rate limits; `src/lib/rate-limit.ts` falls back to in-memory when its env vars aren't set.

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
- **Status colours** use Tailwind's sky (info), emerald (success), amber (warning) and red (danger), always paired with an icon or text. `Badge` has matching variants: `neutral`, `info`, `success`, `warning`, `danger`, `brand`.
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
- **Crisis access:** every patient-facing app screen offers 988.

## Files and encoding

- Files use CRLF line endings. Write UTF-8 and never round-trip files through tools that default to cp1252: Windows Python `open()` without `encoding="utf-8"` once corrupted `—`.
- Prefer the Edit/Write tools, or Node with `utf8`, for scripted edits.
