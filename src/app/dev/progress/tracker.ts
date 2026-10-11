// The build tracker behind /dev/progress: what's built and what's left,
// grouped by the four contract milestones (contract/contract.html) plus the
// client and business work around them. Update it in the same change that
// ships or starts a feature, and bump REVIEWED.

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

export const REVIEWED = "2026-10-11";

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
      { status: "done", owner: "build", title: "Admin log-in", detail: "Accounts made from ADMIN_EMAILS with a temporary password, a forced new password, a required authenticator and their own log-in page; Forgot password, Settings (email and password), and Reset access for each other.", where: "/admin/login" },
      { status: "done", owner: "build", title: "Google sign-in (code)", detail: "Ready and tested locally. It shows only when its keys are set.", where: "docs/live-testing.md" },
      { status: "todo", owner: "accounts", title: "Google sign-in in production", detail: "\"Continue with Google\" goes live once this is done. Production URLs on the Google client, and the consent screen published." },
      { status: "done", owner: "build", title: "Two-step login", detail: "Authenticator app plus 10 backup codes; any user can turn it on in Settings.", where: "/two-factor/setup" },
      { status: "done", owner: "build", title: "Download your data, delete your account", where: "/account/settings" },
      { status: "done", owner: "build", title: "Legal safeguards (six risks)", detail: "Migration 0011: 18+ age screen on sign-up, Google and the raw endpoint; no third-party fonts, images or session replay (CSP-enforced); postal address and unsubscribe for marketing email; renewal terms with consent beside Activate and in Stripe Checkout; /copyright DMCA page.", where: "docs/legal/README.md" },
      { status: "done", owner: "build", title: "Change email and password in Settings", detail: "For patients, providers and admins. Email: a link to the current inbox (or the authenticator app when that inbox is gone), then a link to the new one; the old address is told. Password: change it (other devices are logged out), or add one to a Google account.", where: "/account/settings" },
      { status: "done", owner: "build", title: "Account recovery through support", detail: "\"Can't access your email?\" (from Reset password and Settings): a request with a new contact email, and a photo ID for providers. The account's inbox gets a heads-up; admins check identity in Admin → Account recovery, then move the account and email a link to choose a password. The ID is deleted when the request closes.", where: "/account-recovery" },
      // Onboarding
      { status: "done", owner: "build", title: "Provider onboarding wizard", detail: "Identity, photo, story, who you work with, expertise, fees and background, locations, licenses and NPI, then review and submit.", where: "/provider/onboarding" },
      { status: "done", owner: "build", title: "Live preview, saved progress, license upload", detail: "Step-by-step preview at real size; uploads check ownership and sniff file bytes.", where: "src/components/onboarding" },
      { status: "done", owner: "build", title: "Submission for verification", detail: "Submitted screen, status banners on the dashboard, and the provider's decision emails." },
      { status: "done", owner: "build", title: "Photo crop on upload", detail: "Square crop with zoom and keyboard moves, saved as WebP up to 800×800, in the wizard and the profile editor.", where: "src/components/provider/photo-crop-dialog.tsx" },
      { status: "done", owner: "build", title: "Hold \"Save and continue\" while a file is uploading", detail: "Save, Save & exit and the keyboard shortcut wait with \"Uploading…\" until the photo or license lands." },
      { status: "done", owner: "build", title: "Clean up uploads that are never saved", detail: "The daily job deletes uploads older than a day that no profile or license uses.", where: "src/app/api/cron/daily/route.ts" },
      { status: "done", owner: "build", title: "Abandoned-onboarding reminders", detail: "Emails at 1, 3 and 7 days from the daily job, each sent once; drafts untouched for 14+ days get none.", where: "src/server/onboarding/reminders.ts" },
      { status: "todo", owner: "build", title: "Unsaved-changes warning", detail: "Build plan, slice 4: warn before leaving a wizard step or the profile editor with changes that aren't saved." },
      { status: "todo", owner: "build", title: "Fill in city and state from the ZIP", detail: "Build plan, slice 4: the practice address step looks up the ZIP. The street address stays private either way." },
      { status: "todo", owner: "build", title: "Error summary on long forms", detail: "Build plan, slice 4: a list of what to fix at the top of a step, linking to each field, as well as the inline errors." },
      // Profiles
      { status: "done", owner: "build", title: "Profile editor", detail: "Uses the wizard's sections with a live preview.", where: "/provider/profile" },
      { status: "done", owner: "build", title: "Public provider profile", detail: "With share, save, request, and a dedicated not-found page.", where: "/providers/{name}-{id}" },
      { status: "todo", owner: "build", title: "Provider notification settings", detail: "Choose which emails they get (new requests, reminders). Account and billing emails always go out." },
      // Billing
      { status: "done", owner: "build", title: "Stripe listing subscription (code)", detail: "Better Auth Stripe plugin, the 3-day grace rule, billing page and customer portal. Off until the keys are set.", where: "/provider/billing" },
      { status: "done", owner: "build", title: "Billing emails", detail: "Payment failed, profile paused, payment recovered, cancellation confirmed, each sent once (webhooks, plus the daily job for \"paused\"). Unit-tested; still to try with Stripe test mode.", where: "src/server/billing/notices.ts" },
      // Emails
      { status: "done", owner: "build", title: "Branded account and provider emails", detail: "Verify email, password reset, submitted, approved, changes requested, rejected, and the staff alert for new submissions.", where: "src/server/emails.ts" },
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
      { status: "done", owner: "build", title: "Search screens", detail: "Search bar, filters, phone filter drawer, loading skeleton, empty state, and filters in the URL.", where: "/providers" },
      { status: "done", owner: "build", title: "Quick look overlay and full profile in a new tab", where: "/providers?p=" },
      { status: "done", owner: "build", title: "Home page search connected to results" },
      { status: "done", owner: "build", title: "Saved providers", detail: "Signed out, the heart asks to sign up or log in, then saves on return.", where: "/account" },
      { status: "done", owner: "build", title: "Patient dashboard", detail: "Saved providers and My requests.", where: "/account" },
      { status: "done", owner: "build", title: "Session requests, as a guest or with an account", detail: "Five steps. Emailed to the provider's requests address with Reply-To set to the patient; the patient gets a confirmation.", where: "/request/{name}-{id}" },
      { status: "done", owner: "build", title: "Duplicate, spam and rate protection on requests", detail: "One email per patient and provider per day, limits per IP and per email, and a honeypot." },
      { status: "done", owner: "build", title: "Provider requests inbox", detail: "Mark as contacted, and choose the address requests go to.", where: "/provider/requests" },
      { status: "done", owner: "build", title: "50 sample providers", detail: "Labelled, noindex, never emailed, ranked last. Added or removed from Admin → All providers." },
      { status: "todo", owner: "build", title: "Keep saved providers who leave the directory", detail: "They should stay on the patient's list, labelled unavailable. Today they drop off.", where: "docs/TODO.md" },
      { status: "todo", owner: "build", title: "\"Report this profile\" flow", detail: "Today it links to the contact form. Better: a reason, the provider id, and an admin queue." },
      { status: "todo", owner: "build", title: "Real distance search", detail: "Needs a ZIP-coordinates table, or a geocoder for \"Use my location\". Optional: \"near\" works without it." },
      { status: "todo", owner: "client", title: "Request confirmation copy", detail: "Figma promises a session link and a calendar invite, which the flow doesn't send. \"2-3 business days?\" has a stray \"?\" and disagrees with \"48 hours\".", where: "docs/TODO.md" },
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
      { status: "done", owner: "build", title: "Provider analytics dashboard", detail: "Impressions, profile views, saves, requests and conversion against the previous period; date ranges, trend chart, top search terms (5+ uses) and recent requests.", where: "/provider" },
      { status: "done", owner: "build", title: "Admin site analytics", detail: "Visitors, page views, searches, profile views, requests, sign-ups, top searches and most-viewed providers.", where: "/admin/analytics" },
      { status: "done", owner: "build", title: "Private, built-in analytics", detail: "No cookies or third parties; Do Not Track and GPC respected; visitor hashes deleted daily." },
      { status: "done", owner: "build", title: "Verification queue and review page", detail: "Approve, request changes, reject, suspend and unsuspend, each with a note, an email and an audit entry.", where: "/admin" },
      { status: "done", owner: "build", title: "All providers list and sample management", where: "/admin/providers" },
      { status: "done", owner: "build", title: "Admin accounts", detail: "Created from ADMIN_EMAILS with a temporary password, forced new password, required authenticator, separate admin log-in, and Reset access.", where: "/admin/admins" },
      { status: "todo", owner: "build", title: "Provider blog editor", detail: "Figma D3 list and D4/D5 editor: draft, in review, changes requested, published, unpublished; autosave, cover image, excerpt and slug; output cleaned of unsafe HTML." },
      { status: "todo", owner: "build", title: "Admin blog moderation", detail: "A queue to approve or send back provider posts, with an email at each status change." },
      { status: "todo", owner: "build", title: "Published provider posts on /blog and on profiles", detail: "An \"Articles\" section on the public profile; posts hidden while the provider is suspended." },
      { status: "todo", owner: "build", title: "License expiry tracking", detail: "Licenses store an expiry date, but nothing acts on it yet. Plan: hide the state on expiry, with reminders at 60, 30 and 7 days." },
      { status: "todo", owner: "build", title: "Custom tags report", detail: "Owner request, 2026-10-08: the specialties and approaches providers typed themselves, with counts, so popular ones can join the standard list.", where: "docs/TODO.md" },
      { status: "todo", owner: "build", title: "Site-wide audit log page", detail: "Every decision is logged and each provider shows its history, but there's no page listing all of it." },
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
      { status: "doing", owner: "build", title: "Automated tests", detail: "Unit tests (12 files, 85 passing) and Playwright journeys at desktop and 375px for accounts, email and password changes, account recovery, onboarding, directory, analytics and admin accounts. Still missing: billing, requests from the provider's side, and the blog.", where: "tests/" },
      { status: "todo", owner: "build", title: "Security review", detail: "Every role's access rules tried from a second account, private documents, and the security headers." },
      { status: "todo", owner: "build", title: "Accessibility and performance checks", detail: "Keyboard and screen reader sweep, and Lighthouse on the main pages." },
      { status: "todo", owner: "build", title: "Error monitoring and CI", detail: "Sentry with no personal data, and tests on every push. Neither is set up." },
      { status: "todo", owner: "build", title: "Operations guide", detail: "Keys, payments, webhooks and backups." },
      { status: "todo", owner: "accounts", title: "Production database", detail: "Supabase Postgres as DATABASE_URL on Vercel production, plus BETTER_AUTH_SECRET and ADMIN_EMAILS. The live site has no database yet." },
      { status: "todo", owner: "accounts", title: "Daily job secret", detail: "Set CRON_SECRET on Vercel (production) so the daily job (upload cleanup, onboarding reminders, billing check) can run.", where: "vercel.json" },
      { status: "todo", owner: "accounts", title: "Portal domain", detail: "Point app.psychmind.org at the Vercel project." },
      { status: "todo", owner: "accounts", title: "Email sending domain", detail: "Verify psychmind.org in Resend so EMAIL_FROM can be hello@psychmind.org." },
      { status: "todo", owner: "build", title: "Remove the sample providers, or load the client's real ones", detail: "Admin → All providers → Remove samples." },
      { status: "todo", owner: "client", title: "Final copy review", detail: "The roughly 50 copy and consistency issues from the Figma audit (D27), and \"thousands of verified psychologists\" (D26).", where: "docs/build-plan/BUILD-PLAN.md §4" },
      { status: "todo", owner: "client", title: "Privacy policy: in-house analytics", detail: "What's collected and what isn't, written up in docs/TODO.md for the client.", where: "docs/TODO.md" },
      { status: "todo", owner: "build", title: "Launch, then 30 days of bug fixes" },
      { status: "todo", owner: "client", title: "Price, trial and extra-location fee (D9)", detail: "Moved from Milestone 1 so the client has time to decide. Figma shows $10/month on desktop and $39 on mobile, plus $5 per extra location. The Stripe price waits on this.", where: "src/lib/billing.ts" },
    ],
  },
  {
    id: "business",
    label: "Contract",
    title: "Client and business",
    items: [
      { status: "doing", owner: "build", title: "Send the agreement and the Milestone 1 payment link", detail: "The email and the PDF are drafted. The email still has the [PAYMENT LINK] placeholder, and the contract the [Client name] one.", where: "contract/email.md" },
      { status: "todo", owner: "client", title: "Sign the agreement and pay Milestone 1", detail: "$2,000. Work on each milestone starts once its payment is in." },
      { status: "todo", owner: "client", title: "Book the demo call", detail: "Show provider sign-up, search, session requests and the dashboards." },
      { status: "todo", owner: "client", title: "Option lists (D1)", detail: "Approve the final lists of titles, specialties, approaches, languages, age groups and license types.", where: "src/lib/taxonomy.ts" },
      { status: "todo", owner: "client", title: "HIPAA stance (D17)", detail: "Needs a lawyer. It changes cost, not architecture." },
      { status: "todo", owner: "client", title: "Business postal address", detail: "A street address, USPS PO box or registered mailbox. CAN-SPAM requires it in marketing email; it goes in every email footer. Set LEGAL_POSTAL_ADDRESS on Vercel once we have it.", where: "docs/legal/README.md" },
      { status: "todo", owner: "client", title: "Approve the legal wording (on a call)", detail: "New copy from the legal safeguards: the date-of-birth screen, the under-18 page, the renewal terms and their checkbox, the post-checkout email, the unsubscribe page, /copyright, the email footer lines and the \"Copyright Policy\" footer link. Ideally a lawyer reads it too.", where: "docs/legal/README.md" },
      { status: "todo", owner: "client", title: "Register the DMCA agent", detail: "$6 at dmca.copyright.gov, needs the company's legal name and street address. Renew every 3 years. Then set DMCA_AGENT_* on Vercel and redeploy.", where: "docs/legal/dmca-agent.md" },
    ],
  },
  {
    id: "stripe",
    label: "Setup",
    title: "Stripe",
    items: [
      { status: "todo", owner: "accounts", title: "Run the Stripe flow end to end in test mode", detail: "Any Stripe account works for test mode: product, keys, webhook, then pay with a test card.", where: "docs/live-testing.md §C" },
      { status: "todo", owner: "accounts", title: "Customer portal: cancel at the end of the billing period", detail: "Dashboard → Settings → Billing → Customer portal → Cancellations: allow cancelling, at the end of the billing period. The renewal terms beside Activate promise this (California automatic renewal law). Set it in test and live mode.", where: "docs/legal/README.md" },
      { status: "todo", owner: "accounts", title: "Stripe live mode on the client's account", detail: "Product and price, webhook on www, customer portal (with the cancellation setting above)." },
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
