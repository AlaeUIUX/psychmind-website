# PsychMind app: build plan

The master plan for building the product behind psychmind.org. It combines five research reports in `research/`:

| File | What it holds |
|---|---|
| `research/figma-patient-auth.md` | Every auth and patient frame in Figma (`150:3857`): fields, verbatim copy, states, filter lists, data model, gaps, and 21 copy issues |
| `research/figma-provider.md` | Every provider frame (`255:1412`): sign-up, the 7-step wizard, dashboard, blog editor, option lists, profile data model, gaps, and 29 copy issues |
| `research/mobbin-patient-auth.md` | Mobbin gap research for auth, search, no results, profile, request, patient dashboard, settings and system states, with about 100 references |
| `research/mobbin-provider-admin.md` | Mobbin gap research for onboarding, profile editor, analytics, requests inbox, billing, admin, settings and blog, with 121 references, the provider state machine and the email list |
| `research/architecture.md` | Stack decision, routes, database schema, RLS, search design, slice-by-slice acceptance criteria, definition of done, and the `CLAUDE.md` outline |

**How to use it.** Build one slice per Claude Code session. Before each session, copy the slice's section below into `docs/specs/slice-NN-name.md` (template: `architecture.md` §10.2). Resolve its blocking decisions first. Build it, verify it against the acceptance criteria and the definition of done, then merge.

---

## 1. Ground rules

1. **One design system.** App screens use the landing page's styling: tokens in `globals.css` (`@theme`), the `type-*` roles, warm and blush palette, `surface-soft` cards, `grain` on tinted panels, `SectionBadge` eyebrows, `Button` variants, `Tag`/`VerifiedBadge`, the hand-drawn `doodles`, and the existing `CrisisCard`. Figma gives structure and copy; the landing page gives the finish. No new colours, fonts or one-off pixel values. New primitives go in `src/components/ui` and on `/dev/ui`.
2. **Motion in the app is quieter than marketing.** Use CSS transitions, `Reveal` for page entrance, and skeletons. GSAP is reserved for celebratory moments (submitted, approved, live). Turn **Lenis off on app routes**, because smooth scrolling fights forms, sheets and focus management. Respect reduced motion everywhere.
3. **Copy is client-approved.** Figma copy is used verbatim. Any new microcopy (errors, empty states, emails) is listed in the PR as `TODO(client)` for approval. Copy issues already found go to the client; we don't fix them silently.
4. **Every screen has every state:** loading, empty, error (field, action and page), success, unauthorized, not found, mobile at 375px, keyboard and screen reader. See §6.
5. **Privacy by default:**
   - no ad pixels in the app;
   - no health details in emails, URLs, logs, Sentry or analytics;
   - RLS on every table;
   - a rate limit on every write a stranger can trigger;
   - 988 crisis access on every patient-facing app screen.

## 2. Stack (decided; details in `architecture.md` §3–5)

- **App:** one Next.js 16 app, with route groups `(site)`, `(auth)`, `(patient)` at `/account`, `(provider)` at `/provider`, and `(admin)` at `/admin`.
- **Backend:** Supabase.
  - Postgres with PostGIS, for location search.
  - Auth: email/password, magic link, and admin two-factor login.
  - Storage: a private bucket for licenses, with signed URLs.
  - Cron, for scheduled jobs.
  - A preview database for each pull request.
- **Security layers:** `proxy.ts` refreshes the session, a server-only data access layer checks the role, and RLS is the last line of defence.
- **Payments:** Stripe Checkout, Customer Portal and webhooks; the 3-day grace period runs through Stripe events plus a cron sweep.
- **Email:** Resend with React Email (auth emails go through Resend's mail server too).
- **Forms and filters:** react-hook-form with Zod and Server Actions; nuqs keeps search filters in the URL.
- **Search:** a precomputed `provider_search` table with a `search_providers` database function. It scores results and relaxes filters, and reports what each "close enough" provider misses.
- **Other services:** Upstash (rate limits), Sentry (errors, no personal data), Vercel Analytics on marketing pages only, and our own analytics events in Postgres.
- **Testing:** Vitest, Playwright (desktop and 375px) and pgTAP for RLS.
- **Cost:** about $70–110/month at MVP scale. HIPAA mode, if counsel requires it, is about $1.4–1.6k/month with the same architecture.

## 3. Fix now, before any feature work

| # | Issue | Where |
|---|---|---|
| 1 | **Security:** the blog CMS login popup sends the GitHub token, which has write access to the repo, to whatever site answers its message (`postMessage(..., e.origin)` with no origin check, and no OAuth `state`). A malicious page could steal the token from an editor who is signed in. | `website/src/app/api/callback/route.ts` |
| 2 | The CMS uses `/admin`, which the admin dashboard needs. Move it to `/cms`. | `website/next.config.ts`, `public/admin/` |
| 3 | The contact form has no rate limit or spam honeypot. | `website/src/app/api/contact/route.ts` |
| 4 | `/login` is a visual mock. `/signup`, `/providers` and `/forgot-password` are linked but return 404. | site-wide links |
| 5 | `input` and `card` primitives don't use the tokens; the contact form styles its inputs inline. Unify them in slice 1. | `src/components/ui` |
| 6 | The working tree has uncommitted work (blog and footer refinements). Commit it before slice 0. | git |

## 4. Decisions for the client, grouped by the slice they block

Each decision lists the recommended answer first.

**Needed before slice 2 (schema):**
- **D1. Option lists.** Figma shows only partial lists: specialties and languages show 4 plus "+14 more", and insurance shows placeholders. The provider wizard and patient filters also disagree ("Humanistic" vs "Person-centered", "Adults" vs "Adults +18"). We need one final list each for: professions/titles, specialties, approaches, languages, age groups, session participants, genders, and license types. *We draft them from the audit; the client approves.*
- **D2. Fields the patient side uses but onboarding never collects:** provider gender, fees, insurance, phone, education. *Add gender, fees (with sliding scale) and education to the wizard. Leave phone out. Defer insurance: hide the insurance filter until the client details it.*
- **D3. Address privacy.** *Show city, state and ZIP; keep the street address private.*
- **D4. Launch states.** Which US states first? This affects licensing, the "online" search rule and seed data.

**Needed before slice 3 (auth):**
- **D5. Guest requests.** Figma has "Continue as guest", but the brief says patients have accounts. *Accounts only. Drop the guest path, or keep it only with email verification and a way to claim the request on sign-up.*
- **D6. Google sign-in.** It's shown in Figma. *Launch with email and magic link; add Google in slice 13.*
- **D7. Minimum age for patient accounts is 18.** Requests for minors are made by a parent or guardian using the "Who is this for?" step.

**Needed before slice 4 (onboarding):**
- **D8. When to charge.** The Figma pricing step is before onboarding, but the rules say after approval. *Show pricing up front for information; charge only after approval.*
- **D9. Price.** Figma shows $10/month on desktop and $39/month on mobile. Also decide: free trial or not, and what an extra practice location costs (there's an upgrade modal for more than 3 locations).
- **D10. "Step 1 of 5"** labels on a flow that actually has 7+ steps. *Relabel by section with real counts* (copy change; the client approves).

**Needed before slice 5 (admin):**
- **D11. Reject vs request changes.** *Add "Changes requested", which can be fixed and resubmitted, alongside "Rejected", which is final, with a re-apply rule.*
- **D12. Edits that need re-verification after going live.** *Licenses, name and credentials only.*
- **D13. License expiry.** *Hide automatically, per state, on the expiry date. Reminders at 60, 30 and 7 days.*
- **D14. Admin roles.** *Owner plus staff; two-factor login required.*

**Needed before slice 6 (billing):**
- **D15. What a paused or hidden profile's URL shows.** *An "Unavailable" page with requests turned off.* Also decide what happens in patients' saved lists.
- **D16. Billing page.** *Use Stripe's Customer Portal for card, invoice and cancel management, plus a branded status page.*
- **D17. HIPAA / business-associate stance.** Needs a lawyer. It changes cost, not architecture.

**Needed before slice 10 (requests):**
- **D18. Request statuses** and who sets them. *Sent, Viewed, Contacted, Not a fit, Withdrawn, Expired. The provider sets them from the request link in their email, and requests expire after 14 days without an answer.*
- **D19. Messaging.** "Message" buttons and "Message before request" appear in Figma, against the no-messaging rule. *Remove them* (the client approves the copy change).
- **D20. "Call provider"** needs a public phone number. *Remove the button, or make the phone optional and opt-in.*
- **D21. "Your info is never shared"** conflicts with sending contact details to the chosen provider. The client should reword it.
- **D22. Request fields:** "Who is this for?", preferred times, contact preference, a voicemail-OK option, and a length limit on the note. Decide which are required.
- **D23. Retention.** *Requests 24 months, raw analytics 90 days, search logs 12 months.*

**Needed before slice 11 (analytics):**
- **D24. Keyword privacy threshold.** *Show a search keyword only after 5 or more uses.*

**Needed before slice 12 (blog):**
- **D25. Blog moderation.** *Admin approves provider posts before publishing. Posts are hidden while a provider is paused or suspended.*

**Copy and marketing:**
- **D26.** "Search thousands of verified psychologists" overstates launch supply (100–500 providers).
- **D27.** Send the 50 copy and consistency issues (`figma-patient-auth.md` §14, `figma-provider.md` §9) to the client as one list.

## 5. Slices

The slice order and acceptance criteria are in `architecture.md` §8. This section adds what Figma shows and the states and steps found in the gap research, so nothing is missed. A "+" marks something that is **not in Figma** and must be built anyway, with copy flagged `TODO(client)`.

### Slice 0: Foundations and security fixes
Everything in §3, plus:
- set up the local Supabase stack;
- `env.ts`, the Supabase clients and the session-refresh `proxy.ts`;
- Sentry and security headers;
- Vitest, Playwright and CI;
- `website/CLAUDE.md`, using the outline in `architecture.md` §10.1;
- Playwright screenshot checks so the marketing pages can't change by accident.

### Slice 1: App design system and shells
Figma: the dashboard header and footer (`figma-provider.md` §2), the patient top nav and mobile nav (`figma-patient-auth.md` §3), the auth shell, and the booking shell.

**New primitives, styled like the landing page:**
- **Form fields:** field, input, textarea, select and combobox, multi-select chips, checkbox, radio card, switch.
- **Overlays:** dialog, mobile sheet, tooltip and popover.
- **Navigation and display:** tabs, table, stepper.
- **Feedback:** toast (Sonner, with Undo), skeletons, empty state (with a doodle), and error panel with retry.
- **Status:** a status banner (info, warning, error and success, with an optional countdown and button) and a status chip.
- **Uploads:** an upload dropzone with progress and error states.
- **Dashboard pieces:** stat tile and chart frame.

**Pages:**
- **Shells:** app shell for patient, provider and admin; on mobile the nav becomes a sheet.
- **System pages:** 404, 500 and offline pages in the brand style, with 988 access in the footer.
- **Kitchen sink:** `/dev/ui`, showing every primitive in every state.

### Slice 2: Database schema, RLS, roles and seed
The schema is in `architecture.md` §7. It must model the **provider state machine** (`mobbin-provider-admin.md` §3.1):

> draft → submitted → (changes_requested ↺) → approved_unpaid → live → past_due (3-day grace, still visible) → paused (hidden) → live again on payment. Also: cancel_pending, canceled, suspended, and per-license license_expired.

**Also:**
- **Licenses:** a status for each license, so a provider can be live in TX while NY is pending.
- **Statuses:** request statuses (D18) and the audit log (no updates or deletes allowed).
- **Seed data:** 1 admin, 10 patients and 50 providers covering every state and filter, plus 5,000 synthetic rows for performance tests.

### Slice 3: Auth
**Figma (`figma-patient-auth.md` §4, `figma-provider.md` A1–A2):**
- role select ("Who are you joining as?");
- create account, patient and provider versions;
- log in;
- forgot password → link sent → set a new password.

All are desktop and mobile. The existing `/login` look and copy stay.

**+ Steps and states:**
- **+ Verify email:** a check-your-email screen, resend with a cooldown, and expired or used link states.
- **+ Errors:** wrong password inline; too many attempts or lockout; email already registered, with a "log in instead" link.
- **+ Password reset:** expired or used reset link, and a password-updated success state.
- **+ Session expired:** sign back in and return to the same page, keeping any request draft.
- **+ Role mismatches:** a patient visiting `/provider` gets sent on; a provider who signed up as a patient gets help.
- **+ Admin:** two-factor login enrollment and challenge.
- **+ Loading:** a pending state on every button.
- **+ Fixes:** the mobile provider sign-up currently uses the patient copy; the client fixes the copy.
- **+ Emails:** verify, magic link, reset and email changed. None of them contain personal data.

### Slice 4: Provider onboarding wizard and license upload
**Figma, in order (`figma-provider.md` §3):**
- **P0:** pricing intro (information only, per D8).
- **P1:** identity (name, title, pronouns, banner).
- **P2:** profile picture.
- **P3:** your story.
- **P4a:** who you work with and age groups.
- **P4b:** specialties, approaches and languages.
- **P5:** practice locations, including the limit-reached state and the upgrade modal.
- **P6:** credentials and verification, one entry per licensed state.
- **PV:** mobile preview.

**+ Steps:**
- **+ Gender, fees (with sliding scale) and education** (D2), placed in P1/P4.
- **+ Review & submit**, with an attestation checkbox.
- **+ Submitted** confirmation, with a GSAP moment.
- **+ Pending** screen with a timeline: submitted → in review → decision.
- **+ Changes requested:** the wizard reopens, showing the reason on each field that needs fixing.
- **+ Rejected** screen, with a support contact.
- **+ Approved:** "Activate your listing", which leads to slice 6.

**+ States:**
- **Saving:** autosave on every step, resume from the furthest step, "Save & exit", and an unsaved-changes guard.
- **Uploads:** progress, wrong type or too large, retry, and a file row with remove.
- **Profile photo:** crop and upload.
- **Address:** autocomplete with ZIP lookup; the street address stays private.
- **Validation:** inline, with an error summary at the top.
- **Mobile:** every step works at 375px.
- **Accessibility:** a step counter screen readers can follow.

**+ Emails:**
- submitted;
- abandoned onboarding (1, 3 and 7 days);
- changes requested;
- rejected;
- approved.

### Slice 5: Admin verification queue (nothing designed)
**Pattern:** a Linear or Stripe-style console in our styling (`mobbin-provider-admin.md` §9).

**Screens:**
- **Queue:** oldest first, filters by status, a waiting-time badge, claim/lock so two staff don't review the same provider, and no bulk approve.
- **Review page:** profile summary, licenses, and a document viewer with short-lived signed URLs (every view is audited). Each license has a link to its state licensing board.
- **Decisions:** Approve, Request changes (a reason is required, per field), Reject (a reason is required) and Suspend or unsuspend.
- **Providers list:** search across all providers.
- **License expiry tracker.**
- **Audit log:** read-only.
- **Blog moderation queue:** it arrives with slice 12.

**States:**
- empty queue;
- action failed (the row is left unchanged);
- a provider claimed by someone else;
- no two-factor login, so access is blocked.

**Emails:** a staff alert for new submissions and a reminder when a submission waits too long.

### Slice 6: Billing, grace period and visibility (nothing designed beyond the price card and upgrade modal)
**Screens:**
- **+ Activate listing:** opens Stripe Checkout.
- **+ Checkout return:** success, processing, and cancelled.
- **+ Billing page:** plan, status and next invoice, a "Manage billing" button that opens the Stripe portal, and the invoice list.
- **+ Cancel:** cancel at the end of the period, then restore.

**+ Status banners, shown on every dashboard page:**
- not verified yet;
- verified but unpaid;
- **past due, with a countdown ("paused in 3 days")**;
- paused, hidden from search, with "Pay now";
- live again, as a one-time success message;
- cancellation pending, with the end date;
- canceled;
- suspended.

**Emails:**
- payment failed;
- profile paused;
- payment recovered;
- cancellation confirmed.

**Rule:** paying makes the profile **live within seconds**. A webhook makes it instant, and a cron job double-checks.

### Slice 7: Profile editor and public profile
**Figma:**
- **D2:** "Your public profile" is a **read-only preview**. Its "Edit profile" button doesn't lead anywhere.
- **Public profile:** P1 (`183:13441`) and P1m (`279:7536`), described in `figma-patient-auth.md` §8.

**+ Editor:** editing uses the wizard's sections with a live preview built from the same public components. On mobile, an Edit/Preview toggle.

**+ States:**
- **Saving and leaving:** unsaved-changes guard; field validation; "changes saved" toast.
- **Re-verification:** editing a license sends it back for review (D12).
- **Visibility:** "Not accepting new clients" toggle (recommended).

**Public page:**
- **Verified explainer:** a popover saying what "Verified" means.
- **Online care:** which states the provider is licensed in.
- **Mobile:** a sticky "Request a session" bar.
- **Actions:** Share and Report profile.
- **Request button:** an "already requested" state.
- **Unavailable profile:** "not accepting" and hidden variants (D15).
- **Missing profile:** a dedicated "provider not found" page.
- **Crisis:** a 988 strip.
- **SEO:** metadata that makes no health claims.

### Slice 8: Search engine and search UI
**Figma (`figma-patient-auth.md` §5):**
- **Desktop:** results (S1), empty (S2), logged in (S3), loading skeleton (S4).
- **Mobile:** results (S5), filter drawer (S6), empty (S7), logged in (S8), loading skeleton (S9).
- **Hero assets:** the home page's "What's on your mind?" chips (`656:2889`).

**+ Engine (8a):**
- **Filters:** location radius, plus all the filters.
- **Online rule:** online results are filtered by the patient's state against the provider's license states.
- **Relaxing:** if there are fewer than 10 exact matches, a "close matches" group appears. Each provider in it is labelled with what it misses. State licensing is never relaxed (recommended).
- **Speed:** p95 under 50ms on 5,000 rows.

**+ UI (8b):**
- **Location:** autocomplete, "Use my location", permission denied, unknown or non-US place.
- **Sorting and paging:** a sort control, then pagination or "Show more", restoring scroll position on Back.
- **Mobile filter sheet:** a live "Show N providers" count and a count of selected options per group.
- **No results:** one-tap "Remove X (+N providers)" suggestions, and a separate state for when no one is nearby at all.
- **Errors:** an error state with Retry.
- **Saving while logged out:** a prompt to sign in.
- **URL state:** filters live in the URL, so links can be shared and Back works.
- **Home page:** the hero search is wired up without any visual change.
- **Crisis:** 988 access.
- **Insurance filter:** hidden until the insurance decision in D2 is made.

### Slice 9: Patient saves, dashboard and settings
**Figma:** saved profiles (V1, V1m) and My requests (R1, R1m). The requests list is completed in slice 10.

**+ States:**
- **Saving:** an optimistic heart, an Undo toast, and a rollback if saving fails.
- **Empty states:** for saved providers and for requests.
- **Unavailable providers:** a saved provider who becomes unavailable is labelled.

**+ Settings (nothing designed):**
- **Account details:** profile; change email, which re-verifies the new address; set or change password.
- **Emails:** notification preferences and an unsubscribe landing page.
- **Your data:** download my data, and delete account with an honest explanation of what happens.

### Slice 10: Session requests
**Figma (`figma-patient-auth.md` §11):**
- **B1:** confirm.
- **B2:** session details.
- **B3:** optional note.
- **B4:** sign in or create an account; per D5 the guest path is likely dropped.
- **B5:** review.
- **B6/B7:** confirmation.

**+ Patient flow:**
- **+ Who is this for?** Me, my child or teen, or my partner.
- **+ Preferred times and contact preference** (D22).
- **+ Inline 988 notice** on the note step, using `CrisisCard`, plus a "don't include sensitive details" hint.
- **+ Errors:** field errors, network failure (the draft is kept), and a duplicate request to the same provider.
- **+ Unavailable provider:** the provider becomes unavailable partway through.
- **+ Rate limit:** too many requests in an hour.
- **+ Confirmation:** an honest next step ("The provider will reach out by email or phone"). The "calendar invite" wording is removed; the client approves.

**+ Patient's requests:**
- **List:** the full status set from D18.
- **Detail page:** a timeline of status changes.
- **Actions:** withdraw (with a confirmation), and a "Haven't heard back?" nudge after N days.
- **Empty state.**

**+ Provider inbox (nothing designed):** `/provider/requests`
- **Tabs:** New, Contacted and Not a fit, with an unread dot on new ones.
- **Detail page:** patient contact buttons (email, phone), and a private note.
- **Status changes:** marked *Viewed* automatically when opened. "Not a fit" needs confirming and offers Undo, because the patient sees it.
- **Opening the email link:** handles being logged out, the request belonging to someone else, and a withdrawn request.

**+ Emails** (contain only a link, no personal data):
- new request, to the provider;
- reminder for a request still unanswered after N days;
- status changed, to the patient.

### Slice 11: Provider analytics
**Figma:** D1 Analytics, desktop `338:2214` and mobile `339:4139`, described in `figma-provider.md` §6.

**Tiles:**
- impressions;
- profile views;
- saves;
- session requests;
- keywords, under "How patients found you".

**+ States:**
- **Time ranges:** date-range control with a comparison to the previous period.
- **Low data:** an empty state for new providers, a low-data message, and keywords hidden below the threshold (D24).
- **Loading and errors:** chart skeletons and an error state.
- **Accessibility:** a summary table for screen readers.
- **Data rules:** the provider's own views are excluded and no IP addresses are stored.
- **Requests link:** the "24 total" requests figure links to the inbox.

### Slice 12: Provider blog
**Figma:** D3 blog list and D4/D5 block editor (`figma-provider.md` §3, §7). Leftover table columns ("Company", "File size") need the client to decide.

**+ Editing:**
- Status chips: Draft, In review, Changes requested, Published, Unpublished.
- Autosave, preview, cover image, excerpt, slug and SEO fields, and inline formatting.

**+ Moderation (D25):**
- an admin moderation queue;
- emails at each status change;
- posts hidden while the provider is paused.

**+ Publishing:**
- Published posts appear in `/blog` and in an "Articles" section on the profile.
- The editor's output is cleaned of unsafe content.

### Slice 13: Hardening and launch
- **Security review:** a full RLS audit from a second account.
- **Quality checks:** accessibility sweep, Lighthouse targets, and CSP and security-header checks.
- **Operations:** a runbook (rotating keys, replaying webhooks, restoring the database) and Sentry alerts.
- **Data:** load the client's 50 real sample providers.
- **Legal:** the privacy and cookie policy is checked against how data actually moves (the client approves).
- **Optional:** Google sign-in, and moving the company blog posts out of the CMS so it can be removed.

## 6. Definition of done (every slice)

From `architecture.md` §9:
- types and lint are clean;
- tests pass: unit, pgTAP (allowed **and** denied cases for every role), and a Playwright smoke test at desktop and 375px;
- **all UI states** are built (loading, empty, error, success, unauthorized, not found);
- mobile works, and accessibility checks show no serious problems;
- RLS and rate limits are in place;
- no personal data leaks;
- only design tokens and `type-*` roles are used;
- new copy is listed for the client;
- the Vercel and Supabase previews are verified.

## 7. Timeline

Building full-time with Claude Code: about one session per slice, with slices 4, 8 and 10 split in two. That's roughly **10–13 weeks** to launch. Client turnaround on the §4 decisions is the main thing that could slow the schedule, so send the D1–D27 list now.
