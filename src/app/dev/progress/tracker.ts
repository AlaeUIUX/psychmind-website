// The build tracker behind /dev/progress: what's built and what's left,
// grouped by the four contract milestones (contract/contract.html) plus the
// client and business work around them. Update it in the same change that
// ships or starts a feature, and bump REVIEWED. `blocker` marks what a full
// public release can't ship without (docs/release-audit.md).

export type ItemStatus = "done" | "doing" | "todo";
/** Who moves it forward: the build, a client decision or copy, or an account to set up. */
export type ItemOwner = "build" | "client" | "accounts";

export type TrackerItem = {
  title: string;
  detail?: string;
  status: ItemStatus;
  owner: ItemOwner;
  /** A route, file or doc to look at. */
  where?: string;
  /** The public release can't ship until this is done. */
  blocker?: boolean;
};

export type TrackerGroup = {
  id: string;
  /** "Milestone 1", or a label for groups outside the contract. */
  label: string;
  title: string;
  /** Contract amount in USD, for milestones. */
  amount?: number;
  items: TrackerItem[];
};

export const REVIEWED = "2026-10-30";

const AUDIT = "docs/release-audit.md";

export const TRACKER: TrackerGroup[] = [
  {
    id: "m1",
    label: "Milestone 1",
    title: "Provider sign-up, accounts and profiles",
    amount: 2000,
    items: [
      // Foundations
      { status: "done", owner: "build", title: "App foundations", detail: "Next.js 16, Drizzle on Postgres (PGlite locally) with migrations, portal on app.psychmind.org and marketing on www.", where: "src/db/schema" },
      { status: "done", owner: "build", title: "App design system", detail: "shadcn themed to the landing page, the .app-ui portal scope, and the UI kit.", where: "/dev/ui" },
      { status: "done", owner: "build", title: "Security basics", detail: "CSP with per-request nonces, security headers, rate limits on every public write, the CMS token-leak fix, and a honeypot on the contact form.", where: "src/proxy.ts" },
      // Accounts
      { status: "done", owner: "build", title: "Patient and provider sign-up, email verification, log in", where: "/signup" },
      { status: "done", owner: "build", title: "Password reset", where: "/forgot-password" },
      { status: "done", owner: "build", title: "Sign-up and log-in errors, tested", detail: "Wrong password and unknown email (same message), email already registered (the form reveals nothing; the owner is emailed to log in or reset), logging in before confirming (confirm screen with resend), reset link used twice, under-18, and each role kept to its own area, all in Playwright. Too many attempts is covered by the rate-limit unit tests.", where: "tests/e2e/auth-flows.spec.ts" },
      { status: "done", owner: "build", title: "Admin log-in", detail: "Accounts made from ADMIN_EMAILS with a temporary password, a forced new password, a required authenticator and their own log-in page; Forgot password, Settings (email and password), and Reset access for each other. The console is its own portal at dev.psychmind.org/login (ADMIN_HOST), live since 2026-10-28; admin accounts can't sign in on the regular log-in.", where: "/admin/login" },
      { status: "done", owner: "build", title: "Google sign-in (code)", detail: "Ready and tested locally. It shows only when its keys are set.", where: "docs/live-testing.md" },
      { status: "todo", owner: "accounts", blocker: true, title: "Google sign-in in production", detail: "\"Continue with Google\" goes live once this is done. Production URLs on the Google client, and the consent screen published. The contract lists it in the launch configuration." },
      { status: "done", owner: "build", title: "Two-step login", detail: "Authenticator app plus 10 backup codes; any user can turn it on in Settings.", where: "/two-factor/setup" },
      { status: "done", owner: "build", title: "Download your data, delete your account", where: "/account/settings" },
      { status: "done", owner: "build", title: "Legal safeguards (six risks)", detail: "Migration 0011: 18+ age screen on sign-up, Google and the raw endpoint; no third-party fonts, images or session replay (CSP-enforced); postal address and unsubscribe for marketing email; renewal terms with consent beside Activate and in Stripe Checkout; /copyright DMCA page.", where: "docs/legal/README.md" },
      { status: "done", owner: "build", title: "Change email and password in Settings", detail: "For patients, providers and admins. Email: a link to the current inbox (or the authenticator app when that inbox is gone), then a link to the new one; the old address is told. Password: change it (other devices are logged out), or add one to a Google account.", where: "/account/settings" },
      { status: "done", owner: "build", title: "Account recovery through support", detail: "\"Can't access your email?\" (from Reset password and Settings): a request with a new contact email, and a photo ID for providers. The account's inbox gets a heads-up; admins check identity in Admin → Account recovery, then move the account and email a link to choose a password. The ID is deleted when the request closes.", where: "/account-recovery" },
      { status: "todo", owner: "build", blocker: true, title: "988 on every auth and request screen", detail: "The auth shell has no crisis access: log in, sign up, and request steps 1, 2, 4 and 5, the \"not taking new clients\" view and the confirmation. Only request step 3 and the under-18 screen show CrisisStrip (CLAUDE.md rule).", where: "src/components/auth/auth-shell.tsx" },
      { status: "done", owner: "build", title: "Expired confirmation link message", detail: "Every confirmation link now returns through /auth/verified. An expired or broken link opens log in with a note to log in for a new one; a link opened again after confirming says the email is confirmed, then carries on to where it was going. Tested in Playwright (2026-10-30); new copy is TODO(client).", where: "src/app/auth/verified/route.ts" },
      // Onboarding
      { status: "done", owner: "build", title: "Provider onboarding wizard", detail: "Identity, photo, story, who you work with, expertise, fees and background, locations, licenses and NPI, then review and submit.", where: "/provider/onboarding" },
      { status: "done", owner: "build", title: "Live preview, saved progress, license upload", detail: "Step-by-step preview at real size; uploads check ownership and sniff file bytes.", where: "src/components/onboarding" },
      { status: "done", owner: "build", title: "Submission for verification", detail: "Submitted screen, dashboard banners from draft to suspended (including past due with its countdown, paused, and license re-review), and the provider's decision emails. The missing banners are a separate item.", where: "src/components/provider/provider-banner.tsx" },
      { status: "done", owner: "build", title: "Photo crop on upload", detail: "Square crop with zoom and keyboard moves, saved as WebP up to 800×800, in the wizard and the profile editor.", where: "src/components/provider/photo-crop-dialog.tsx" },
      { status: "done", owner: "build", title: "Hold \"Save and continue\" while a file is uploading", detail: "Save, Save & exit and the keyboard shortcut wait with \"Uploading…\" until the photo or license lands." },
      { status: "done", owner: "build", title: "Clean up uploads that are never saved", detail: "The daily job deletes uploads older than a day that no profile or license uses.", where: "src/app/api/cron/daily/route.ts" },
      { status: "done", owner: "build", title: "Abandoned-onboarding reminders", detail: "Emails at 1, 3 and 7 days from the daily job, each sent once; drafts untouched for 14+ days get none.", where: "src/server/onboarding/reminders.ts" },
      { status: "done", owner: "build", title: "Unsaved-changes warning", detail: "Leaving a wizard step or the profile editor with unsaved changes asks first: stay, leave without saving, or save and leave. Covers links, Save & exit, the browser's Back button and closing the tab.", where: "src/components/app/unsaved-changes-guard.tsx" },
      { status: "done", owner: "build", title: "Fill in city and state from the ZIP", detail: "Optional: a known ZIP fills an empty city and state (looked up on our server, so browsers still contact no other host). If the lookup fails or disagrees, nothing is overwritten and the fields stay typeable.", where: "src/server/zip.ts" },
      { status: "done", owner: "build", title: "Error summary on long forms", detail: "A failed save lists what to fix at the top of the step, scrolls to it, and each line jumps to its field (opening a collapsed location or license card). Before, steps with choice chips left focus on the button and nothing scrolled.", where: "src/components/forms/form-error-summary.tsx" },
      { status: "done", owner: "build", title: "License uploads capped at 4 MB", detail: "Vercel Functions refuse request bodies over 4.5 MB, so license documents are now limited to 4 MB, in the browser check, the server and the text (the upload hint and the onboarding welcome; Figma said 10 MB). Owner's call, 2026-10-30.", where: "src/lib/provider/uploads.ts" },
      { status: "todo", owner: "build", title: "Submitted page fixes", detail: "The \"Profile submitted\" time is the time of each visit, not submittedAt; it says you can keep editing, but the editor is locked in review; and support is support@psychmind.org while other pages say hello@psychmind.co.", where: "src/app/provider/onboarding/submitted/page.tsx" },
      // Profiles
      { status: "done", owner: "build", title: "Profile editor", detail: "Uses the wizard's sections. Since 2026-10-30 there's no preview squeezed in beside the form (owner's call): \"View profile\" opens the whole profile in a new tab (/provider/preview, in the public page's layout, whatever the status), on phones too.", where: "/provider/profile" },
      { status: "done", owner: "build", title: "Public provider profile", detail: "With share, save, request, and a dedicated not-found page.", where: "/providers/{name}-{id}" },
      { status: "done", owner: "build", title: "Not accepting new clients, license re-review", detail: "A toggle in Fees & background (requests are refused while it's on). The nav shows a count of new requests.", where: "src/components/provider/sections/practice-form.tsx" },
      { status: "done", owner: "build", title: "Re-verify name, title, NPI and new states (D12)", detail: "Owner's rules, 2026-10-30. Once verified, a new name, title, business name, NPI or license waits for our team: the public profile keeps the verified details meanwhile, and the editor says what's in review. A new state (a location plus its license) stays off the profile and out of search until its license is verified. Story, who you work with, expertise, fees, photo and banner change right away. Admins approve (applies them) or decline with a note (shown on the dashboard), and the provider is emailed. Unit and Playwright tested.", where: "src/lib/provider/review.ts" },
      { status: "todo", owner: "build", title: "Verify the requests address", detail: "The address requests go to is saved without a confirmation link, so a typo sends patients' names, contact details and notes to a stranger.", where: "src/server/requests/actions.ts" },
      { status: "done", owner: "build", title: "Email notification settings", detail: "Every account chooses its optional emails in Settings. Providers: new session requests (they still land under Requests), profile reminders. Admins: providers to verify, account recovery requests. Everyone: news and tips (the same opt-out as unsubscribe links). Account, security, billing and verification emails always go out.", where: "src/lib/notifications.ts" },
      // Billing
      { status: "done", owner: "build", title: "Stripe listing subscription (code)", detail: "Better Auth Stripe plugin, the 3-day grace rule, billing page and customer portal. Off until the keys are set. Gaps found on 2026-10-28 are separate items.", where: "/provider/billing" },
      { status: "todo", owner: "build", blocker: true, title: "Stop billing suspended or rejected providers", detail: "Billing checks \"verified\" before \"has a subscription\", so they never see Manage billing, and suspending doesn't touch Stripe. They'd keep paying while hidden, against the renewal terms (\"Cancel anytime… from Billing\"). Cancel or pause in Stripe on suspension, and always show Manage billing to subscribers.", where: "src/app/provider/(dashboard)/billing/page.tsx" },
      { status: "todo", owner: "build", title: "Missing provider banners", detail: "No cancellation-pending, canceled or one-time \"live again\" banner; a canceled subscription maps to unpaid and reads \"Activate your listing\". For rejected or suspended providers, \"Getting listed\" still shows verification in progress.", where: "src/components/provider/provider-banner.tsx" },
      { status: "todo", owner: "build", title: "Billing gaps", detail: "No \"processing\" checkout return; with Stripe off the badge says \"Not active\" while the dashboard says \"Live\"; and the extra-location modal sends providers to Billing, where they can't buy locations.", where: "src/app/provider/(dashboard)/billing/page.tsx" },
      { status: "done", owner: "build", title: "Billing emails", detail: "Payment failed, profile paused, payment recovered, cancellation confirmed, each sent once (webhooks, plus the daily job for \"paused\"). Unit-tested; still to try with Stripe test mode.", where: "src/server/billing/notices.ts" },
      // Emails
      { status: "done", owner: "build", title: "Branded account and provider emails", detail: "Verify email, password reset, submitted, approved, changes requested, rejected, and the staff alert for new submissions. Redesigned 2026-10-30 in the landing's look: stone paper, serif headline, the privacy promise's layers, an ink button, the site footer's sign-off and the boat at sea. All 32 emails can be reviewed at /dev/emails.", where: "/dev/emails" },
    ],
  },
  {
    id: "m2",
    label: "Milestone 2",
    title: "Search engine, directory and session requests",
    amount: 2000,
    items: [
      { status: "done", owner: "build", title: "Search engine", detail: "Specialty, approach, language, gender, age group, price (with sliding scale), format and location. OR within a filter, AND across. Unit-tested.", where: "src/lib/search/engine.ts" },
      { status: "done", owner: "build", title: "Online by state, in person by place", detail: "Online needs a license in the patient's state. In person matches the same ZIP, then city, ZIP area, then state." },
      { status: "done", owner: "build", title: "Ranking, counts per filter, close matches", detail: "Close matches show what each provider misses. Location is never relaxed." },
      { status: "done", owner: "build", title: "ZIP in the home search", detail: "Session format asks for a ZIP, online too (licensing is by state). It names the place as you type: the state from the ZIP table, then the city from a public, IP-rate-limited lookup on our server (/api/place). Online searches by the state, in person by the place.", where: "src/components/home/hero-search.tsx" },
      { status: "done", owner: "build", title: "Search screens", detail: "Search bar, filters, phone filter drawer, loading skeleton, empty state, and filters in the URL.", where: "/providers" },
      { status: "done", owner: "build", title: "Sort, Show more, Verified explainer, Retry", detail: "A sort menu and Show more on results, the Verified explainer, the directory's error page with Retry, and arrow keys between providers in the quick look." },
      { status: "done", owner: "build", title: "Quick look overlay and full profile in a new tab", where: "/providers?p=" },
      { status: "done", owner: "build", title: "Home page search connected to results" },
      { status: "done", owner: "build", title: "Saved providers", detail: "Signed out, the heart asks to sign up or log in, then saves on return.", where: "/account" },
      { status: "done", owner: "build", title: "Patient dashboard", detail: "Saved providers and My requests.", where: "/account" },
      { status: "done", owner: "build", title: "Session requests, as a guest or with an account", detail: "Five steps. Emailed to the provider's requests address with Reply-To set to the patient; the patient gets a confirmation. The account detour has a gap, listed separately.", where: "/request/{name}-{id}" },
      { status: "done", owner: "build", title: "Duplicate, spam and rate protection on requests", detail: "One email per patient and provider per day, limits per IP and per email, and a honeypot." },
      { status: "done", owner: "build", title: "Provider requests inbox", detail: "Mark as contacted, and choose the address requests go to.", where: "/provider/requests" },
      { status: "done", owner: "build", title: "50 sample providers", detail: "Labelled, noindex, never emailed, ranked last. Added or removed from Admin → All providers." },
      { status: "todo", owner: "build", title: "Keep the request draft through log-in, sign-up and errors", detail: "The draft lives in tab-only sessionStorage, and the confirmation link opens a new tab, which lands on step 4 with the defaults and no note. submit() has no try/catch, so a network error drops it too (plan slice 10: keep the draft).", where: "src/components/requests/request-wizard.tsx" },
      { status: "todo", owner: "build", title: "Keep saved providers who leave the directory", detail: "They should stay on the patient's list, labelled unavailable. Today they drop off, and a request's \"Profile\" link then 404s.", where: "docs/TODO.md" },
      { status: "todo", owner: "client", blocker: true, title: "Request confirmation copy", detail: "Figma promises a session link and a calendar invite, which the flow doesn't send. \"2-3 business days?\" has a stray \"?\" and disagrees with \"48 hours\". Also: \"We sent an email on your behalf!\" when the provider turned request emails off.", where: "docs/TODO.md" },
      { status: "todo", owner: "client", title: "Health details in search URLs", detail: "Specialty and the free-text \"What's on your mind?\" sit in the search URL, so they reach logs and browser history. CLAUDE.md says no health details in URLs; the plan asked for shareable filter URLs. Decide which wins (and say so in the privacy policy).", where: "src/lib/search/filters.ts" },
      { status: "todo", owner: "client", title: "Insurance filter (D2)", detail: "Hidden until the client says how insurance should work." },
      { status: "todo", owner: "client", title: "\"Session type\" filter", detail: "Individuals, couples, families, groups. Not in Figma's filters; add it only if the client wants it." },
      { status: "todo", owner: "client", title: "Launch states (D4)", detail: "Which US states first. It affects licensing, online search and the real provider list." },
    ],
  },
  {
    id: "m3",
    label: "Milestone 3",
    title: "Analytics and admin section",
    amount: 2000,
    items: [
      { status: "done", owner: "build", title: "Provider analytics dashboard", detail: "Impressions, profile views, saves, requests and conversion against the previous period; date ranges, trend chart, top search terms (5+ uses) and recent requests.", where: "/provider/analytics" },
      { status: "done", owner: "build", title: "Provider dashboard: sidebar, Overview and What's new", detail: "A sidebar for providers and the admin console (DashboardShell). The provider home leads with account health (listing, verification, profile, licenses, billing, requests, one action each) and the last 7 days; What's new reads lib/changelog.ts. Group labels and changelog entries need client copy.", where: "/provider" },
      { status: "done", owner: "build", title: "Admin site analytics", detail: "Visitors, page views, searches, profile views, requests, sign-ups, top searches and most-viewed providers.", where: "/admin/analytics" },
      { status: "done", owner: "build", title: "Private, built-in analytics", detail: "No cookies or third parties; Do Not Track and GPC respected; visitor hashes deleted daily." },
      { status: "done", owner: "build", title: "Verification queue and review page", detail: "Approve, request changes, reject, suspend and unsuspend, each audited; for a verified provider's later changes, Approve changes or Decline changes, with a side-by-side of each change. Decisions are emailed, except suspend and unsuspend (a separate item).", where: "/admin/queue" },
      { status: "done", owner: "build", title: "All providers list and sample management", where: "/admin/providers" },
      { status: "done", owner: "build", title: "Admin accounts", detail: "Created from ADMIN_EMAILS with a temporary password, forced new password, required authenticator, separate admin log-in, and Reset access.", where: "/admin/admins" },
      { status: "todo", owner: "build", title: "Email providers on suspend and unsuspend", detail: "Both decisions are audited but send nothing, and unsuspend takes no note.", where: "src/server/admin/actions.ts" },
      { status: "todo", owner: "build", blocker: true, title: "Provider blog editor", detail: "Figma D3 list and D4/D5 editor: draft, in review, changes requested, published, unpublished; autosave, cover image, excerpt and slug; output cleaned of unsafe HTML. Nothing exists yet: no table, routes or nav item." },
      { status: "todo", owner: "build", blocker: true, title: "Admin blog moderation", detail: "A queue to approve or send back provider posts, with an email at each status change." },
      { status: "todo", owner: "build", blocker: true, title: "Published provider posts on /blog and on profiles", detail: "An \"Articles\" section on the public profile; posts hidden while the provider is suspended. Today the Providers tab on /blog lists Markdown files by invented authors." },
      { status: "todo", owner: "build", title: "Blog managed in the admin console", detail: "Owner request, 2026-10-28: the team writes and publishes its own posts in Admin (title, excerpt, category, author, cover image), replacing the Decap editor at /cms, with the same states as the provider editor. The current thumbnails are placeholders until real covers are uploaded there.", where: "/cms" },
      { status: "todo", owner: "build", title: "Landing page on live data", detail: "Owner request, 2026-10-28: the home page is still all fixed content. Its blog section should show the latest published posts, and its reviews, provider count and figures should come from the app once those exist.", where: "src/app/(site)/page.tsx" },
      { status: "done", owner: "build", title: "Blog index and reader", detail: "After theboringblog.ai (owner request, 2026-10-28): posts by year with a PsychMind team / Providers switch and category chips, infinite scroll, a rendered shore with the girl at the foot (animation/blog-shore), and posts that snap part to part. The blog header has Go back and Subscribe; no footer.", where: "/blog" },
      { status: "done", owner: "build", title: "Blog subscriptions", detail: "Subscribe in the blog header: an email, then a confirmation link (double opt-in, 3 days), rate-limited, with a honeypot; the same answer whether or not the address was known. Stored in blog_subscriber; leaving is the marketing opt-out.", where: "src/server/blog/subscribe-actions.ts" },
      { status: "done", owner: "build", title: "Marketing pages refreshed", detail: "Owner requests, 2026-10-28: How it works (hero and drifting showcase, the steps card, reviews, questions, the voyage to the provider band); How it works for providers (in the footer as \"For providers\"); the mission as the founders' letter; and Contact as one screen, the form in the portal's style beside the hero's voyage, sent through the app's email.", where: "/how-it-works/providers" },
      { status: "todo", owner: "client", blocker: true, title: "Copy for the refreshed pages", detail: "New wording marked TODO(client): the provider steps and questions, the mission's lede, the contact page's errors and sent view, the footer's \"For providers\". Also: the mission text names Dani and Bri, the letter's doodle and signatures Brenda and Dee." },
      { status: "todo", owner: "build", title: "Email new posts to blog subscribers", detail: "Nothing is sent to subscribers yet, though the Subscribe dialog promises it: when a post is published, email the confirmed subscribers through server/marketing.ts (unsubscribe link, postal address)." },
      { status: "todo", owner: "build", title: "Blog fixes", detail: "Six of seven excerpts are a reading time and date (\"4 min read · Jan 2025\"), which becomes the meta description and the post's first line; the home Resource center sorts by month name as text (February after January); on computers the blog has no footer or legal links (phones get the site footer since 2026-10-29), and Subscribe has no privacy link.", where: "src/lib/blog.ts" },
      { status: "todo", owner: "build", title: "License expiry tracking", detail: "provider_license.expires_at exists, but nothing collects or reads it. Plan (D13): collect the date, hide the state on expiry, remind at 60, 30 and 7 days." },
      { status: "todo", owner: "build", title: "Custom tags report", detail: "Owner request, 2026-10-08: the specialties and approaches providers typed themselves, with counts, so popular ones can join the standard list.", where: "docs/TODO.md" },
      { status: "todo", owner: "client", title: "Blog moderation rule (D25)", detail: "Recommended: an admin approves provider posts before they're published." },
      { status: "todo", owner: "client", title: "Analytics footnote copy", detail: "\"updated everyday\" and \"helps optimizing\" are shown verbatim from Figma D1." },
    ],
  },
  {
    id: "m4",
    label: "Milestone 4",
    title: "Testing, bug fixing and launch",
    amount: 2000,
    items: [
      { status: "doing", owner: "build", title: "Automated tests", detail: "Unit tests (14 files, 102 passing) and Playwright journeys at desktop and 375px for accounts, auth edge cases, email and password changes, account recovery, legal safeguards, onboarding, a guest request through to the provider's inbox, directory, analytics and admin accounts. Still missing: billing, the blog, the contact form and blog subscription, and the log-in detour during a request.", where: "tests/" },
      { status: "done", owner: "build", title: "Page sweep, 2026-10-30", detail: "All 70 pages at 1280 and 375, signed out, as a patient, a provider and an admin, including the new dashboards (provider Overview, Analytics and What's new; the admin queue at /admin/queue): no page errors, no horizontal scroll, role redirects and 404s correct. First run 2026-10-28; findings in the release audit.", where: AUDIT },
      { status: "todo", owner: "build", blocker: true, title: "Security review", detail: "Every role's access rules tried from a second account, private documents, and the security headers. The audit's first-pass findings are the next item." },
      { status: "todo", owner: "build", title: "Security fixes from the audit", detail: "License documents need only the admin role (no two-step or temporary-password check); removing someone from ADMIN_EMAILS takes effect only at their next sign-in; two admins can decide one provider at once, and a recovery can be completed and declined at once; /auth/continue changes a role on a GET; the dead /api/contact route; Decap loads from unpkg with no version pin or SRI; and no row-level security (matters if the database is Supabase with its Data API on).", where: AUDIT },
      { status: "todo", owner: "build", title: "Loading and error pages", detail: "No loading.tsx or error.tsx under (auth), /account, /provider, /admin, (reader) or (contact): a failed query replaces the page with global-error, and unknown admin ids show the marketing 404. The save heart has no error handling either." },
      { status: "todo", owner: "build", blocker: true, title: "Accessibility and performance checks", detail: "Keyboard and screen reader sweep, and Lighthouse on the main pages. Open from the landing review (.ui-review): hero search focus ring and focus loss, reduced-motion polaroids, tiny polaroid dots." },
      { status: "todo", owner: "build", blocker: true, title: "Real favicon and app icons", detail: "src/app/favicon.ico is still create-next-app's; there's no icon, Apple icon or manifest.", where: "src/app/favicon.ico" },
      { status: "todo", owner: "build", title: "SEO basics", detail: "robots.txt and sitemap.xml are 404 (live too); no Open Graph or Twitter tags, metadataBase, share image or canonical URLs; portal and auth pages aren't noindexed." },
      { status: "todo", owner: "build", title: "Error monitoring and CI", detail: "Sentry with no personal data, and tests on every push. Neither is set up." },
      { status: "todo", owner: "build", blocker: true, title: "Operations guide and backups", detail: "Keys, payments, webhooks, and restoring the database. Neither the guide nor a backup plan exists (contract Milestone 4)." },
      { status: "done", owner: "accounts", title: "Production database", detail: "Live: www.psychmind.org serves log-in, search and the admin portal (checked 2026-10-28). Confirm which host it is and that backups are on." },
      { status: "done", owner: "accounts", title: "Admin portal domain", detail: "dev.psychmind.org serves the admin log-in." },
      { status: "todo", owner: "accounts", blocker: true, title: "Daily job secret", detail: "Check that CRON_SECRET is set on Vercel (production). Without it the daily job (upload cleanup, onboarding reminders, billing check) returns 401.", where: "vercel.json" },
      { status: "todo", owner: "accounts", title: "Portal domain", detail: "app.psychmind.org points at Vercel but returns Vercel's 404. Add it to the project and set APP_HOST, or keep the portal on www, where it works today." },
      { status: "todo", owner: "accounts", blocker: true, title: "Email sending domain", detail: "Verify psychmind.org in Resend so EMAIL_FROM can be hello@psychmind.org." },
      { status: "todo", owner: "build", blocker: true, title: "Remove the sample providers, or load the client's real ones", detail: "They're live in search on www.psychmind.org. Admin → All providers → Remove samples." },
      { status: "todo", owner: "client", blocker: true, title: "Made-up figures, reviews and providers on the home page", detail: "\"< 24h\" to first session and a \"4.8\" rating (there are no ratings); placeholder testimonials, two praising messaging, which doesn't exist; three fictional \"verified\" providers with stock photos; \"Meet 2,400+ verified providers\". Replace with real ones or remove.", where: "src/components/home" },
      { status: "todo", owner: "client", blocker: true, title: "Placeholder blog posts", detail: "6 of 7 posts say \"This is placeholder content\", including a \"$850K pre-seed round\" and an \"AI search tool\" story, some by invented \"Dr.\" authors.", where: "content/blog" },
      { status: "todo", owner: "client", blocker: true, title: "Legal pages match the app", detail: "Cookie policy: describes analytics cookies, a consent banner and a cookie-settings link that don't exist. Privacy: claims messages and bookings, leaves out the in-house analytics, marketing email and ID uploads, and §8 is a placeholder. Terms: §6 repeats §5, the guardian line contradicts 18+, jurisdiction \"still being established\", nothing on the subscription's renewal. Every address is @psychmind.co, the app uses psychmind.org. Ideally a lawyer reads it.", where: AUDIT },
      { status: "todo", owner: "client", blocker: true, title: "Final copy review", detail: "The roughly 50 copy and consistency issues from the Figma audit (D27), \"thousands of verified psychologists\" (D26), and the How it works FAQ, whose placeholder answers promise an insurance filter, messaging and a cancellation policy.", where: "docs/build-plan/BUILD-PLAN.md §4" },
      { status: "todo", owner: "client", blocker: true, title: "Hero music licence", detail: "The track on the home page has no confirmed licence (TODO(client)).", where: "src/components/home/showcase.tsx" },
      { status: "todo", owner: "client", title: "Social links", detail: "Instagram, X and LinkedIn link to \"#\" in the footer and on /mission. Send the URLs, or they're hidden.", where: "src/components/shared/social-links.tsx" },
      { status: "todo", owner: "client", blocker: true, title: "Price, trial and extra-location fee (D9)", detail: "Moved from Milestone 1 so the client has time to decide. Figma shows $10/month on desktop and $39 on mobile, plus $5 per extra location. The Stripe price waits on this.", where: "src/lib/billing.ts" },
      { status: "todo", owner: "build", title: "Launch, then 30 days of bug fixes" },
    ],
  },
  {
    id: "business",
    label: "Contract",
    title: "Client and business",
    items: [
      { status: "doing", owner: "build", title: "Send the agreement and the Milestone 1 payment link", detail: "The email and the PDF are drafted. As of 2026-10-28 the email still has the [PAYMENT LINK] placeholder, and the contract the [Client name] one.", where: "contract/email.md" },
      { status: "todo", owner: "client", title: "Sign the agreement and pay Milestone 1", detail: "$2,000. Work on each milestone starts once its payment is in." },
      { status: "todo", owner: "client", title: "Book the demo call", detail: "Show provider sign-up, search, session requests and the dashboards." },
      { status: "todo", owner: "client", title: "Option lists (D1)", detail: "Approve the final lists of titles, specialties, approaches, languages, age groups and license types.", where: "src/lib/taxonomy.ts" },
      { status: "todo", owner: "client", title: "HIPAA stance (D17)", detail: "Needs a lawyer. It changes cost, not architecture." },
      { status: "todo", owner: "client", blocker: true, title: "Business postal address", detail: "A street address, USPS PO box or registered mailbox. CAN-SPAM requires it in marketing email; it goes in every email footer. Set LEGAL_POSTAL_ADDRESS on Vercel once we have it.", where: "docs/legal/README.md" },
      { status: "todo", owner: "client", blocker: true, title: "Approve the legal wording (on a call)", detail: "New copy from the legal safeguards: the date-of-birth screen, the under-18 page, the renewal terms and their checkbox, the post-checkout email, the unsubscribe page, /copyright, the email footer lines and the \"Copyright Policy\" footer link. Ideally a lawyer reads it too.", where: "docs/legal/README.md" },
      { status: "todo", owner: "client", blocker: true, title: "Register the DMCA agent", detail: "$6 at dmca.copyright.gov, needs the company's legal name and street address. Renew every 3 years. Then set DMCA_AGENT_* on Vercel and redeploy.", where: "docs/legal/dmca-agent.md" },
    ],
  },
  {
    id: "stripe",
    label: "Setup",
    title: "Stripe",
    items: [
      { status: "todo", owner: "accounts", blocker: true, title: "Run the Stripe flow end to end in test mode", detail: "Any Stripe account works for test mode: product, keys, webhook, then pay with a test card.", where: "docs/live-testing.md §C" },
      { status: "todo", owner: "accounts", blocker: true, title: "Customer portal: cancel at the end of the billing period", detail: "Dashboard → Settings → Billing → Customer portal → Cancellations: allow cancelling, at the end of the billing period. The renewal terms beside Activate promise this (California automatic renewal law). Set it in test and live mode.", where: "docs/legal/README.md" },
      { status: "todo", owner: "accounts", blocker: true, title: "Stripe live mode on the client's account", detail: "Product and price, webhook on www, customer portal (with the cancellation setting above)." },
    ],
  },
  {
    id: "later",
    label: "Optional",
    title: "Build-plan extras, not in the contract",
    items: [
      { status: "todo", owner: "build", title: "\"Report this profile\" flow", detail: "Today it links to the contact form. Better: a reason, the provider id, and an admin queue." },
      { status: "todo", owner: "build", title: "Real distance search", detail: "Needs a ZIP-coordinates table, or a geocoder for \"Use my location\". \"Near\" works without it." },
      { status: "todo", owner: "build", title: "Site-wide audit log page", detail: "Every decision is logged and each provider shows its history, but no page lists it all, so license- and recovery-document views appear nowhere." },
      { status: "todo", owner: "build", title: "Patient request extras", detail: "Statuses beyond new and contacted (D18), withdraw, a request detail page, an \"Unavailable\" profile page (D15), an \"already requested\" state, a sticky Request bar on phones, \"Who is this for?\" and preferred times (D22), and Undo on unsaving.", where: AUDIT },
      { status: "todo", owner: "build", title: "Provider extras", detail: "The changes-requested reason on each field, re-applying after rejection (D11), analytics loading and error states, and CSV export.", where: AUDIT },
      { status: "todo", owner: "build", title: "Admin extras", detail: "Search, paging and status filters on the lists, claim/lock in the queue, links to state licensing boards, and a reminder when a submission waits too long.", where: AUDIT },
      { status: "todo", owner: "build", title: "Account extras", detail: "Turning two-step login off and regenerating backup codes; keeping ?next= on the top Log in / Create account link and on session-expired redirects." },
      { status: "todo", owner: "build", title: "Site extras", detail: "Structured data, permanent (308) host redirects, 988 in the footer and on /contact, and Browse providers / For providers in the header menu." },
    ],
  },
];

export const OWNER_LABEL: Record<ItemOwner, string> = {
  build: "Build",
  client: "Client",
  accounts: "Accounts",
};

/** Share of a group that's built: done counts 1, in progress counts half. */
export function groupProgress(items: TrackerItem[]) {
  const done = items.filter((i) => i.status === "done").length;
  const doing = items.filter((i) => i.status === "doing").length;
  const percent = items.length ? Math.round(((done + doing / 2) / items.length) * 100) : 0;
  return { done, doing, total: items.length, percent };
}
