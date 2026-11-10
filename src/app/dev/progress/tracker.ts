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

export const REVIEWED = "2026-11-10";

const AUDIT = "docs/release-audit.md";
/** The 2026-11-09 full audit and security plan live outside this public repo. */
const PRIVATE_AUDIT = "../audit/audit-2026-11-09.md (private)";

/** What each working session changed, newest first, named by the items below
 *  (owner request, 2026-11-10: report through this page). Add an entry with
 *  every change that moves an item, and keep the item titles exact. */
export type TrackerUpdate = {
  date: string;
  title: string;
  changes: { milestone: string; item: string; status: ItemStatus; note?: string }[];
};

export const UPDATES: TrackerUpdate[] = [
  {
    date: "2026-11-10",
    title: "Founders shown as Dani and Bri (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Copy for the refreshed pages", status: "todo", note: "The landing's doodle tags, its alt text and the letter's signatures now say Dani and Bri, as the mission page does: the founders chose aliases. Internal notes still call the client Dee." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog posts: a spring between parts (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog index and reader", status: "done", note: "Mouse, trackpad and keys: the landing's smooth scroll (Lenis) with its snap; one wheel notch flows a little, then springs to the next part (about a second, a touch of overshoot). One gesture moves one part. Phones keep the browser's own snap, which is the phone's scroll physics (UIKit paging on iOS)." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog note in the privacy promise's look (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "The note under the posts (written by people who do the work, not a diagnosis, 988) is now drawn like the landing's privacy promise: grey frame, white card, plain lines, the icon only on hover. On the home page and /blog." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Covers on /blog, and the home grid mixed (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "/blog shows each post's cover beside it (above it on phones). The home grid alternates UI and girl covers (post dates moved, placeholders anyway), and posts now sort by real date, not alphabetically." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog cards: title first, author, bigger UI covers (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "UI covers shown close up, about 1.5× real size, as on the landing's bento. The search post's cover is now the session format panel (In person, a ZIP, places by distance) instead of the dot diagram. Card captions: the title in medium, then category · read time · author, smaller." },
      { milestone: "Milestone 4", item: "Placeholder blog posts", status: "doing", note: "Every post's author is \"John Doe\" for now, until real authors are named." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog covers, fourth pass: no text, the girl for posts about people (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "Nothing written on the covers any more; the title beside them does that. Product posts keep their UI; the therapy, CBT and anxiety posts show the girl in the landing's dot print (in her boat, where two roads part, under a rain cloud), rendered from the landing's own 3D pieces at /dev/cover-studio." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog covers, third pass: real product UI, after incident.io (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "Drawings replaced: each cover now shows what its post is about in our own UI (search bar, credentials card with a loupe, approach filter, request card, dashboard) or a quiet diagram (search's location rings). One 640 × 360 layout scaled like a picture, title larger and set by hand on two lines, a real blur under it, the red almost gone." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog covers, second pass: one size, depth, a grid (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "Every cover 16:9 with its line the same size and height; white shapes with soft shadows, clouds behind, the drawing fading and blurring under the line; a faint red in the grey; simpler drawings. The home page's Resource center is now a plain grid of same-size cards." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Blog covers and new posts, after incident.io (not committed yet)",
    changes: [
      { milestone: "Milestone 3", item: "Blog covers, one set", status: "done", note: "Same paper, serif and pencil drawing on every cover; on the home page and at the top of each post." },
      { milestone: "Milestone 4", item: "Placeholder blog posts", status: "doing", note: "Seven full drafts in place. Waiting on your review and real authors for the two provider posts." },
      { milestone: "Milestone 3", item: "Blog managed in the admin console", status: "todo", note: "Its editor will pick a cover drawing and a cover line." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Failed emails and approved wording, live (commit cbe8f01)",
    changes: [
      { milestone: "Milestone 1", item: "Email failures recorded and visible", status: "done", note: "New Admin → Failed emails page, with a count in the sidebar." },
      { milestone: "Milestone 1", item: "Patient account recovery: what evidence is enough", status: "todo", note: "Suggested rule ready for your call with Dee." },
      { milestone: "Milestone 1", item: "Google sign-in in production", status: "todo", note: "Still waiting on Dee." },
      { milestone: "Milestone 1", item: "Approval email and timeline variants", status: "done", note: "Today's new wording approved by you." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Milestone 1 fixes, live (commit cbe8f01)",
    changes: [
      { milestone: "Milestone 1", item: "Safer account recovery", status: "done", note: "Confirm the new address, 72-hour wait, one-click \"This wasn't me\", sign-ins since the request." },
      { milestone: "Milestone 1", item: "Account security hardening", status: "done", note: "Private endpoints closed, fairer limits, breached-password check, Log out other devices." },
      { milestone: "Milestone 1", item: "Locations: keep verified licences", status: "done" },
      { milestone: "Milestone 1", item: "Provider dashboard fixes", status: "done" },
      { milestone: "Milestone 1", item: "Admin account links on the admin host", status: "done" },
      { milestone: "Milestone 1", item: "Approval email and timeline variants", status: "done", note: "New wording waits for Dee." },
      { milestone: "Milestone 1", item: "Email failures recorded and visible", status: "todo", note: "Explained; built in the next entry." },
      { milestone: "Milestone 4", item: "Billing go-live fixes", status: "todo", note: "Moved from Milestone 1: payments wait on Dee's choice of provider (new item \"Payment provider\")." },
      { milestone: "Milestone 1", item: "Google sign-in in production", status: "todo", note: "Waiting on Dee's Google Cloud setup." },
    ],
  },
  {
    date: "2026-11-10",
    title: "Security fixes, live on psychmind.org (commit 9762c45)",
    changes: [
      { milestone: "Milestone 4", item: "Dependency updates", status: "done", note: "Next.js 16.4.5 and Zod 4.6.7; no critical or high advisories left." },
      { milestone: "Milestone 1", item: "Close the Google sign-in gaps before the Google keys go live", status: "done", note: "Safe to add the Google keys once Dee finishes her part." },
      { milestone: "Milestone 3", item: "Admin account hardening", status: "doing", note: "Team-address sign-up, promotion, removed admins and the sign-up redirect fixed; host, reset, audit-trail and session rules still open." },
      { milestone: "Milestone 2", item: "Guest request privacy", status: "doing", note: "Guests are never told a request is a repeat. Requests in someone else's name still open (needs Dee's OK)." },
      { milestone: "Milestone 4", item: "Retire or lock down the CMS", status: "doing", note: "Decap pinned with an integrity check and blocked on the admin host. Replacing it is Milestone 3's admin blog." },
      { milestone: "Milestone 4", item: "Domains and inboxes", status: "todo", note: "psychmind.co isn't ours and needn't be bought: move the legal pages to @psychmind.org once it has inboxes." },
    ],
  },
  {
    date: "2026-11-09",
    title: "Milestone 2 finished, and the full audit",
    changes: [
      { milestone: "Milestone 2", item: "Keep the request draft through log-in, sign-up and errors", status: "done" },
      { milestone: "Milestone 2", item: "Keep saved providers who leave the directory", status: "done", note: "Unavailable card and page; billing scenario at /dev/billing-scenario (local)." },
      { milestone: "Milestone 2", item: "Request confirmation copy", status: "done", note: "Dee's answer: the request is in the provider's dashboard." },
      { milestone: "Milestone 2", item: "Insurance", status: "done" },
      { milestone: "Milestone 2", item: "\"Session type\" filter", status: "done" },
      { milestone: "Milestone 2", item: "Health details in search URLs", status: "done", note: "Kept as they are (Dee)." },
      { milestone: "Milestone 2", item: "Launch states (D4)", status: "done", note: "All states." },
      { milestone: "All", item: "2026-11-09 audit", status: "todo", note: "122 findings, filed as new items in every milestone; details in the private audit outside the repo." },
    ],
  },
];

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
      { status: "todo", owner: "accounts", blocker: true, title: "Google sign-in in production", detail: "\"Continue with Google\" goes live once this is done. Dee creates the Google Cloud project and adds the developer as Owner (guide: /guides/google-sign-in); the developer then sets the production URLs and publishes the consent screen. The contract lists it in the launch configuration.", where: "/guides/google-sign-in" },
      { status: "done", owner: "build", title: "Founding providers", detail: "One shared link (Admin → Settings) for the first 51 providers: listed free, for good, once verified. Owner request, 2026-11-05.", where: "src/server/founding.ts" },
      { status: "done", owner: "build", title: "Two-step login", detail: "Authenticator app plus 10 backup codes; any user can turn it on in Settings.", where: "/two-factor/setup" },
      { status: "done", owner: "build", title: "Download your data, delete your account", where: "/account/settings" },
      { status: "done", owner: "build", title: "Legal safeguards (six risks)", detail: "Migration 0011: 18+ age screen on sign-up, Google and the raw endpoint; no third-party fonts, images or session replay (CSP-enforced); postal address and unsubscribe for marketing email; renewal terms with consent beside Activate and in Stripe Checkout; /copyright DMCA page.", where: "docs/legal/README.md" },
      { status: "done", owner: "build", title: "Change email and password in Settings", detail: "For patients, providers and admins. Email: a link to the current inbox (or the authenticator app when that inbox is gone), then a link to the new one; the old address is told. Password: change it (other devices are logged out), or add one to a Google account.", where: "/account/settings" },
      { status: "done", owner: "build", title: "Account recovery through support", detail: "\"Can't access your email?\" (from Reset password and Settings): a request with a new contact email, and a photo ID for providers. The account's inbox gets a heads-up; admins check identity in Admin → Account recovery, then move the account and email a link to choose a password. The ID is deleted when the request closes.", where: "/account-recovery" },
      { status: "done", owner: "build", title: "988 on every auth and request screen", detail: "The auth shell's footer carries a quiet 988 strip (CrisisStrip tone=\"quiet\") on log in, sign up, every request step, \"not taking new clients\" and the confirmation. The admin log-in leaves it out. The separate strips on request step 3 and the under-18 page went, so there's one per page.", where: "src/components/auth/auth-shell.tsx" },
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
      { status: "done", owner: "build", title: "Submitted page fixes", detail: "Shows when the profile was actually submitted (submittedAt, in the viewer's time zone). The \"keep editing\" row is gone, since the profile is locked in review; the preview row opens /provider/preview in a new tab. Support is hello@psychmind.co, like the legal pages (client to confirm .co or .org).", where: "src/app/provider/onboarding/submitted/page.tsx" },
      // Profiles
      { status: "done", owner: "build", title: "Profile editor", detail: "Uses the wizard's sections. Since 2026-10-30 there's no preview squeezed in beside the form (owner's call): \"View profile\" opens the whole profile in a new tab (/provider/preview, in the public page's layout, whatever the status), on phones too.", where: "/provider/profile" },
      { status: "done", owner: "build", title: "Public provider profile", detail: "With share, save, request, and a dedicated not-found page.", where: "/providers/{name}-{id}" },
      { status: "done", owner: "build", title: "Not accepting new clients, license re-review", detail: "A toggle in Fees & background (requests are refused while it's on). The nav shows a count of new requests.", where: "src/components/provider/sections/practice-form.tsx" },
      { status: "done", owner: "build", title: "Re-verify name, title, NPI and new states (D12)", detail: "Owner's rules, 2026-10-30. Once verified, a new name, title, business name, NPI or license waits for our team: the public profile keeps the verified details meanwhile, and the editor says what's in review. A new state (a location plus its license) stays off the profile and out of search until its license is verified. Story, who you work with, expertise, fees, photo and banner change right away. Admins approve (applies them) or decline with a note (shown on the dashboard), and the provider is emailed. Unit and Playwright tested.", where: "src/lib/provider/review.ts" },
      { status: "done", owner: "build", title: "Verify the requests address", detail: "A new requests address waits until its inbox confirms it with a one-time link (24 hours; a button on /request-email/confirm, which works signed out, since it's often an assistant's inbox). Until then requests keep going to the confirmed address or the account email. Settings shows what's waiting, with Resend and Cancel; setting it back to the account email is immediate. Migration 0018. Unit and Playwright tested; new copy is TODO(client).", where: "src/server/requests/request-email.ts" },
      { status: "done", owner: "build", title: "Email notification settings", detail: "Every account chooses its optional emails in Settings. Providers: new session requests (they still land under Requests), profile reminders. Admins: providers to verify, account recovery requests. Everyone: news and tips (the same opt-out as unsubscribe links). Account, security, billing and verification emails always go out.", where: "src/lib/notifications.ts" },
      // Billing
      { status: "done", owner: "build", title: "Stripe listing subscription (code)", detail: "Better Auth Stripe plugin, the 3-day grace rule, billing page and customer portal. Off until the keys are set. Gaps found on 2026-10-28 are separate items.", where: "/provider/billing" },
      { status: "done", owner: "build", title: "Stop billing suspended or rejected providers", detail: "Suspending pauses collection on their Stripe subscription (invoices are voided) and unsuspending resumes it; if Stripe refuses, the admin is told to do it in the Stripe dashboard. Anyone with a subscription sees Manage billing, whatever their status, so they can always cancel. Refunds for the period already paid stay the team's call. Untested against Stripe until test mode is set up.", where: "src/server/billing/pause.ts" },
      { status: "done", owner: "build", title: "Missing provider banners", detail: "\"Your listing ends on …\" after canceling, \"Your listing has ended\" with Reactivate once it runs out (no longer \"Activate your listing\"), and \"You're live again\" for 3 days after a suspension is lifted or a failed payment goes through. Account health says the same. For rejected or suspended providers, the Overview badge says so and \"Getting listed\" stops at that step with a red cross instead of a pulsing \"in progress\".", where: "src/components/provider/provider-banner.tsx" },
      { status: "done", owner: "build", title: "Billing gaps", detail: "Back from checkout before Stripe's webhook, Billing says it's confirming the payment, hides Activate (no paying twice) and refreshes itself for a minute; a slow payment reads \"Processing\". With Stripe off, the badge says \"Live\", like the dashboard. The extra-location dialog no longer sends providers to Billing: it asks them to contact us, and the team adds locations on the provider's admin page (Practice locations). Buying them online waits on their price (D9).", where: "src/app/provider/(dashboard)/billing/page.tsx" },
      { status: "done", owner: "build", title: "Billing emails", detail: "Payment failed, profile paused, payment recovered, cancellation confirmed, each sent once (webhooks, plus the daily job for \"paused\"). Unit-tested; still to try with Stripe test mode.", where: "src/server/billing/notices.ts" },
      // Emails
      { status: "done", owner: "build", title: "Branded account and provider emails", detail: "Verify email, password reset, submitted, approved, changes requested, rejected, and the staff alert for new submissions. Redesigned 2026-10-30 in the landing's look: stone paper, serif headline, the privacy promise's layers, an ink button, the site footer's sign-off and the boat at sea. Every email can be reviewed at /dev/emails.", where: "/dev/emails" },
      // 2026-11-09 audit (private, outside the repo). Security items name the area only.
      { status: "done", owner: "build", title: "Close the Google sign-in gaps before the Google keys go live", detail: "Fixed 2026-11-10 (audit M1-01, M1-06): Google sign-in only through its redirect flow, the age check on every account-creation path, and no Google session for admins or anyone with two-step login.", where: PRIVATE_AUDIT },
      { status: "done", owner: "build", title: "Safer account recovery", detail: "Done 2026-11-10 (audit M1-02): the new contact address is confirmed by link before the request reaches the queue; the account's own address then gets a one-click \"This wasn't me\" that cancels it; \"Move account\" waits 72 hours after that (not for requests made while signed in); the admin page shows sign-ins since the request; two admins can't both act. New wording approved by the owner (2026-11-10). Still the client's call: what evidence recovers a patient account.", where: "src/server/account/recovery.ts" },
      { status: "todo", owner: "client", title: "Patient account recovery: what evidence is enough", detail: "To agree with Dee (suggested 2026-11-10). Patients send no ID, so move a patient account only when all of these hold: the new address is confirmed and the 72 hours passed with no \"This wasn't me\" (built); the name matches the account; they give two details only the owner would know (about when they joined, a provider they saved or contacted, the phone number on a request); with two-step login on, a photo ID too; and no sign-ins since the request. Otherwise decline. Once agreed, the form asks for those details and the admin page lays them side by side." },
      { status: "done", owner: "build", title: "Email failures recorded and visible", detail: "Done 2026-11-10 (audit M1-03): every email that can't be sent is recorded (recipient, subject and error only, never the body) and listed in Admin → Failed emails, with a count in the sidebar and Mark handled; a warning there when production has no sender address (EMAIL_FROM); alerts to several admins go out one at a time; records are deleted after 90 days.", where: "src/server/email.ts" },
      { status: "done", owner: "build", title: "Account security hardening", detail: "Done 2026-11-10 (audit M1-07, M1-08, M1-22, M1-23): private auth endpoints refused when called straight over HTTP, fairer sign-in limits (per address and network, then per address), daily caps on account emails per address, a breached-password check (fails open if the service is down), emails and other devices signed out when a password is added or the email changes, and \"Log out other devices\" in Settings.", where: PRIVATE_AUDIT },
      { status: "done", owner: "build", title: "Locations: keep verified licences", detail: "Done 2026-11-10 (audit M1-13): removing a location or moving it to another state asks first when its license is verified; the verified license stays on file (not public) and comes back with the state; the Overview says \"Not in search\" when no location is in a verified state.", where: "src/server/provider/actions.ts" },
      { status: "done", owner: "build", title: "Provider dashboard fixes", detail: "Done 2026-11-10 (audit M1-16 to M1-21): the declined-changes note clears on the next save; Remove and Retry on uploads no longer submit the step; providers asked for changes get their own reminders (1, 3, 7 days, once per request); \"won't be charged\" only when the pause went through; \"Send it again\" asks for the email once the screen forgets it; the data export shows errors and now includes email choices, recovery requests, account events and provider names. New wording approved by the owner (2026-11-10).", where: PRIVATE_AUDIT },
      { status: "done", owner: "build", title: "Admin account links on the admin host", detail: "Done 2026-11-10 (audit M1-15): a team member's change-email, password-reset and \"password changed\" links open on the admin host, and the admin log-in keeps those pages as its destination.", where: "src/server/url.ts" },
      { status: "done", owner: "build", title: "Approval email and timeline variants", detail: "Done 2026-11-10 (audit M1-14): one rule (listingNeedsPayment) for the dashboard, the onboarding and submitted timelines and the approval email: \"Activate your listing\" only when a provider has to pay; founding providers and everyone while billing is off get \"you're verified, and you're live\". New wording approved by the owner (2026-11-10).", where: "src/server/emails.ts" },
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
      { status: "done", owner: "build", title: "Keep the request draft through log-in, sign-up and errors", detail: "Session type, format and note are kept in localStorage for 24 hours (as long as the confirmation link lasts), so the link's new tab picks them up; cleared once sent, expired drafts swept. ?next= now survives the confirm screen, its resend and an unconfirmed log-in, and a dropped connection on send keeps everything with a message (TODO(client) copy).", where: "src/components/requests/request-wizard.tsx" },
      { status: "done", owner: "build", title: "Keep saved providers who leave the directory", detail: "Built: they stay on the patient's list as \"Currently unavailable\" (name and title only, no photo; Saved still un-saves) and come back when listed again. A profile link to anyone listed before, from a saved list, a request or an old share, now says \"{name} is currently unavailable\" (noindex) instead of not found; never-approved profiles still 404. Copy TODO(client). Walked through locally: paying, invoice failed (grace), unavailable, and back.", where: "src/server/directory/data.ts" },
      { status: "done", owner: "client", title: "Request confirmation copy", detail: "Dee, 2026-11-09: no email promises. The sent screen now says the request is in the provider's dashboard and they'll answer as soon as possible (no session link, calendar invite or \"We sent an email on your behalf!\"). Emails themselves are unchanged.", where: "src/components/requests/request-wizard.tsx" },
      { status: "done", owner: "client", title: "Health details in search URLs", detail: "Dee, 2026-11-09: keep them as they are (shareable filter links, free text included). The privacy policy should say so (Legal pages item).", where: "src/lib/search/filters.ts" },
      { status: "done", owner: "build", title: "Insurance", detail: "Dee, 2026-11-09: modelled on the big US therapist directories. Providers pick in-network plans plus \"Out of network\" (superbill) under Fees & background; the profile lists them; search filters by plan with counts. 20 common plans, draft list TODO(client). Samples get a spread of plans (migration 0021).", where: "src/lib/taxonomy.ts" },
      { status: "done", owner: "build", title: "\"Session type\" filter", detail: "Dee, 2026-11-09: added. Individuals, couples, families, groups, from what providers already give on their profile.", where: "src/components/search/filters-panel.tsx" },
      { status: "done", owner: "client", title: "Launch states (D4)", detail: "Dee, 2026-11-09: all states. Every state and DC is already open; nothing to change." },
      // 2026-11-09 audit (private, outside the repo).
      { status: "doing", owner: "build", blocker: true, title: "Guest request privacy", detail: "A guest's email is never confirmed (audit M2-01). Fixed 2026-11-10: only signed-in patients are told a request is a repeat; guests always see the normal confirmation. Still open: requests in someone else's name (hold guest requests until a link in the email is clicked; changes the sent screen, so the client approves).", where: PRIVATE_AUDIT },
      { status: "todo", owner: "build", title: "Requests to sample providers store real details", detail: "The wizard says it's a demo only on its last screen, after storing the name, email, phone and note. Warn on step 1 and store nothing personal, or remove the samples (audit M2-02).", where: "src/server/requests/actions.ts" },
      { status: "todo", owner: "build", title: "Request flow fixes", detail: "Recommended providers ignore the patient's location; an abandoned note can outlive 24 hours on a shared computer; next is lost on Google and other detours; guest requests don't reach My requests; Back leaves the flow; un-saving an unavailable provider can't be undone; request links to unavailable providers 404 (audit M2-03 to M2-09).", where: "src/components/requests/request-wizard.tsx" },
      { status: "todo", owner: "build", title: "Directory and request polish", detail: "Back to results without filters, dead ends in the wizard, a double-send race, the demo request status, insurance on cards and label mismatches, the marketing header ignoring the session, long text at 375px, the Requests breadcrumb, ?save=1 on a GET (audit M2-10 to M2-19)." },
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
      { status: "done", owner: "build", title: "Private, built-in analytics", detail: "No cookies or third parties; Do Not Track and GPC skip the visitor count (other counts still run; audit 2026-11-09 M3-28); visitor hashes deleted daily." },
      { status: "done", owner: "build", title: "Verification queue and review page", detail: "Approve, request changes, reject, suspend and unsuspend, each audited; for a verified provider's later changes, Approve changes or Decline changes, with a side-by-side of each change. Decisions are emailed, except suspend and unsuspend (a separate item).", where: "/admin/queue" },
      { status: "done", owner: "build", title: "All providers list and sample management", where: "/admin/providers" },
      { status: "done", owner: "build", title: "Admin accounts", detail: "Created from ADMIN_EMAILS with a temporary password, forced new password, required authenticator, separate admin log-in, and Reset access.", where: "/admin/admins" },
      { status: "todo", owner: "build", title: "Email providers on suspend and unsuspend", detail: "Both decisions are audited but send nothing, and unsuspend takes no note.", where: "src/server/admin/actions.ts" },
      { status: "todo", owner: "build", blocker: true, title: "Provider blog editor", detail: "Figma D3 list and D4/D5 editor: draft, in review, changes requested, published, unpublished; autosave, cover image, excerpt and slug; output cleaned of unsafe HTML. Nothing exists yet: no table, routes or nav item." },
      { status: "todo", owner: "build", blocker: true, title: "Admin blog moderation", detail: "A queue to approve or send back provider posts, with an email at each status change." },
      { status: "todo", owner: "build", blocker: true, title: "Published provider posts on /blog and on profiles", detail: "An \"Articles\" section on the public profile; posts hidden while the provider is suspended. Today the Providers tab on /blog lists Markdown files by invented authors." },
      { status: "todo", owner: "build", title: "Blog managed in the admin console", detail: "Owner request, 2026-10-28: the team writes and publishes its own posts in Admin (title, excerpt, category, author, cover image), replacing the Decap editor at /cms, with the same states as the provider editor. 2026-11-10: confirmed as the plan, replacing the Decap CMS at /cms (see \"Retire or lock down the CMS\"). Waiting on the owner's research for exactly what the editor should do. Covers are now drawn (see \"Blog covers, one set\"): the editor picks a cover drawing and types a cover line instead of uploading an image.", where: "/cms" },
      { status: "todo", owner: "build", title: "Landing page on live data", detail: "Owner request, 2026-10-28: the home page is still all fixed content. Its blog section should show the latest published posts, and its reviews, provider count and figures should come from the app once those exist.", where: "src/app/(site)/page.tsx" },
      { status: "done", owner: "build", title: "Blog index and reader", detail: "After theboringblog.ai (owner request, 2026-10-28): posts by year with a PsychMind team / Providers switch and category chips, infinite scroll, a rendered shore with the girl at the foot (animation/blog-shore), and posts that snap part to part. The blog header has Go back and Subscribe; no footer.", where: "/blog" },
      { status: "done", owner: "build", title: "Blog covers, one set", detail: "Owner request, 2026-11-10, after incident.io/blog: every cover is one 640 × 360 picture scaled to its box, on the landing's grey with the faintest trace of red, with nothing written on it (the title beside it says what it is). Posts about the product show the actual thing in our own UI or a quiet diagram (search bar, credentials under a loupe, location rings, dashboard daily totals, approach filter, request card); posts about people show the girl in the landing's dot print (in her boat, where two roads part, under a rain cloud), rendered from the landing's own 3D pieces at /dev/cover-studio and saved by scripts/render-covers.mjs. Depth from the landing's focus pull; the picture blurs and fades at its foot. The same picture in the home page's Resource center (a plain grid of same-size cards) and at the top of each post. A post picks `cover:`; the CMS offers the same choices, and a unit test keeps them in step. All of them at /dev/covers.", where: "/dev/covers" },
      { status: "done", owner: "build", title: "Blog subscriptions", detail: "Subscribe in the blog header: an email, then a confirmation link (double opt-in, 3 days), rate-limited, with a honeypot; the same answer whether or not the address was known. Stored in blog_subscriber; leaving is the marketing opt-out.", where: "src/server/blog/subscribe-actions.ts" },
      { status: "done", owner: "build", title: "Marketing pages refreshed", detail: "Owner requests, 2026-10-28: How it works (hero and drifting showcase, the steps card, reviews, questions, the voyage to the provider band); How it works for providers (in the footer as \"For providers\"); the mission as the founders' letter; and Contact as one screen, the form in the portal's style beside the hero's voyage, sent through the app's email.", where: "/how-it-works/providers" },
      { status: "todo", owner: "client", blocker: true, title: "Copy for the refreshed pages", detail: "New wording marked TODO(client): the provider steps and questions, the mission's lede, the contact page's errors and sent view, the footer's \"For providers\". The founders go by the aliases Dani and Bri everywhere (owner, 2026-11-10)." },
      { status: "todo", owner: "build", title: "Email new posts to blog subscribers", detail: "Nothing is sent to subscribers yet, though the Subscribe dialog promises it: when a post is published, email the confirmed subscribers through server/marketing.ts (unsubscribe link, postal address)." },
      { status: "todo", owner: "build", title: "Blog fixes", detail: "Six of seven excerpts are a reading time and date (\"4 min read · Jan 2025\"), which becomes the meta description and the post's first line; the home Resource center sorts by month name as text (February after January); on computers the blog has no footer or legal links (only the /blog index gets the site footer on phones; post pages have none on any device), and Subscribe has no privacy link.", where: "src/lib/blog.ts" },
      { status: "todo", owner: "build", title: "License expiry tracking", detail: "provider_license.expires_at exists, but nothing collects or reads it. Plan (D13): collect the date, hide the state on expiry, remind at 60, 30 and 7 days." },
      { status: "todo", owner: "build", title: "Custom tags report", detail: "Owner request, 2026-10-08: the specialties and approaches providers typed themselves, with counts, so popular ones can join the standard list.", where: "docs/TODO.md" },
      { status: "todo", owner: "client", title: "Blog moderation rule (D25)", detail: "Recommended: an admin approves provider posts before they're published." },
      { status: "todo", owner: "client", title: "Analytics footnote copy", detail: "\"updated everyday\" and \"helps optimizing\" are shown verbatim from Figma D1." },
      // 2026-11-09 audit (private, outside the repo).
      { status: "doing", owner: "build", blocker: true, title: "Admin account hardening", detail: "Fixed 2026-11-10: team-address sign-up, promotion and removal (M3-01, M3-02), the sign-up redirect regression (M3-04), the document routes' admin check (M3-10), and admin sessions on the main site (M3-03: the raw sign-in endpoints are refused over HTTP and a promotion ends the sign-in). Still open: password-reset rules, the audit trail, audit events and session length (audit M3-08, M3-09, M3-16, M3-17).", where: PRIVATE_AUDIT },
      { status: "todo", owner: "build", title: "Safe verification decisions", detail: "Approve exactly what was reviewed, conditional updates so two admins can't both decide, and a Reset access that survives a failed email (audit M3-05 to M3-07).", where: "src/server/admin/actions.ts" },
      { status: "todo", owner: "client", title: "Founding spot rules", detail: "Spots are claimed at sign-up, never released and invisible in the console, and deleting a founding account frees one. Decide when a spot counts and when it's released; then a Founding column and a remove action (audit M3-12).", where: "src/server/founding.ts" },
      { status: "todo", owner: "build", title: "Site-wide analytics on every page", detail: "Only the home page, search, profiles and the request flow report views, so the admin's site-wide visitors and page views undercount (audit M3-13). Also per-provider caps and the Do Not Track wording (M3-28).", where: "src/lib/analytics/events.ts" },
      { status: "todo", owner: "build", title: "Admin console polish", detail: "Queue order for change requests, double Reset access, history labels and truncation, the founding link button, the sample card message, UTC dates, mismatched counts, the first log-in timeout, role checks inside data functions, the admin log-in for non-admins, listing state on provider pages, a duplicate NPI check, the queue at 375px (audit M3-18 to M3-31)." },
    ],
  },
  {
    id: "m4",
    label: "Milestone 4",
    title: "Testing, bug fixing and launch",
    amount: 2000,
    items: [
      { status: "doing", owner: "build", title: "Automated tests", detail: "Unit tests (17 files, 124 passing) and Playwright journeys for accounts, auth edge cases, email and password changes, account recovery, legal safeguards, onboarding, a guest request through to the provider's inbox, directory, analytics and admin accounts. Only the directory and UI-kit specs run at 375px; the rest skip phones. Still missing: billing, the blog, the contact form and blog subscription, the daily job, the founding link, unavailable providers, the admin host (ADMIN_HOST is never set in tests) and real Postgres (every test runs on PGlite). Audit 2026-11-09 M4-19.", where: "tests/" },
      { status: "done", owner: "build", title: "Page sweep, 2026-10-30", detail: "All 70 pages at 1280 and 375, signed out, as a patient, a provider and an admin, including the new dashboards (provider Overview, Analytics and What's new; the admin queue at /admin/queue): no page errors, no horizontal scroll, role redirects and 404s correct. First run 2026-10-28; findings in the release audit.", where: AUDIT },
      { status: "todo", owner: "build", blocker: true, title: "Security review", detail: "Every role's access rules tried from a second account, private documents, and the security headers. The audit's first-pass findings are the next item." },
      { status: "todo", owner: "build", title: "Security fixes from the audit", detail: "License documents need only the admin role (no two-step or temporary-password check); removing someone from ADMIN_EMAILS doesn't end their access while they keep using it (sessions renew on use); two admins can decide one provider at once, and a recovery can be completed and declined at once; /auth/continue changes a role on a GET; the dead /api/contact route; Decap loads from unpkg with no version pin or SRI; and no row-level security (matters if the database is Supabase with its Data API on).", where: AUDIT },
      { status: "todo", owner: "build", title: "Loading and error pages", detail: "No loading.tsx or error.tsx under (auth), /account, /provider, /admin, (reader) or (contact): a failed query replaces the page with global-error, and unknown admin ids show the marketing 404. The save heart and the Requests \"Contacted\" switch don't catch a failed call." },
      { status: "todo", owner: "build", blocker: true, title: "Accessibility and performance checks", detail: "Keyboard and screen reader sweep, and Lighthouse on the main pages. Open from the landing review (.ui-review): hero search focus ring and focus loss, reduced-motion polaroids, tiny polaroid dots. Found 2026-11-09: focus lost between request steps, the search bar's panels unreachable by keyboard, \"Save & exit\" unnamed on phones, the insurance picker's label (audit M4-17)." },
      { status: "todo", owner: "build", blocker: true, title: "Real favicon and app icons", detail: "src/app/favicon.ico is still create-next-app's; there's no icon, Apple icon or manifest.", where: "src/app/favicon.ico" },
      { status: "todo", owner: "build", title: "SEO basics", detail: "robots.txt and sitemap.xml are 404 (live too); no Open Graph or Twitter tags, metadataBase, share image or canonical URLs, and host redirects are temporary (307). Portal and auth pages are already noindexed. Audit 2026-11-09 M4-20." },
      { status: "todo", owner: "build", title: "Error monitoring and CI", detail: "Sentry with no personal data, and tests on every push. Neither is set up." },
      { status: "todo", owner: "build", blocker: true, title: "Operations guide and backups", detail: "Keys, payments, webhooks, and restoring the database. Neither the guide nor a backup plan exists (contract Milestone 4)." },
      { status: "done", owner: "accounts", title: "Production database", detail: "Live: www.psychmind.org serves log-in, search and the admin portal (checked 2026-10-28). Confirm which host it is and that backups are on." },
      { status: "done", owner: "accounts", title: "Admin portal domain", detail: "dev.psychmind.org serves the admin log-in." },
      { status: "todo", owner: "accounts", blocker: true, title: "Daily job secret", detail: "Check that CRON_SECRET is set on Vercel (production). Without it the daily job (upload cleanup, onboarding reminders, billing check) returns 401.", where: "vercel.json" },
      { status: "todo", owner: "accounts", title: "Portal domain", detail: "app.psychmind.org points at Vercel but returns Vercel's 404. Add it to the project and set APP_HOST, or keep the portal on www, where it works today." },
      { status: "todo", owner: "accounts", blocker: true, title: "Email sending domain", detail: "Verify psychmind.org in Resend so EMAIL_FROM can be hello@psychmind.org." },
      { status: "todo", owner: "build", blocker: true, title: "Remove the sample providers, or load the client's real ones", detail: "They're live in search on www.psychmind.org. Admin → All providers → Remove samples." },
      { status: "todo", owner: "client", blocker: true, title: "Made-up figures, reviews and providers on the home page", detail: "\"< 24h\" to first session and a \"4.8\" rating (there are no ratings); placeholder testimonials, two praising messaging, which doesn't exist; three fictional \"verified\" providers with stock photos; \"Meet 2,400+ verified providers\". Replace with real ones or remove.", where: "src/components/home" },
      { status: "doing", owner: "client", blocker: true, title: "Placeholder blog posts", detail: "2026-11-10: replaced with seven full drafts in incident.io's voice, in the same categories and the same team / provider split, saying only what the product really does (verification, search rules, private stats). The \"$850K pre-seed round\" and \"AI search tool\" posts are gone. Still open: the client reviews every post, and the two provider posts get real provider authors (\"Dr. Danny Schwelberg\" and \"Dr. Sara Olisz\" are invented) and a clinician's read.", where: "content/blog" },
      { status: "todo", owner: "client", blocker: true, title: "Legal pages match the app", detail: "Cookie policy: describes analytics cookies, a consent banner and a cookie-settings link that don't exist. Privacy: claims messages and bookings, leaves out the in-house analytics, marketing email and ID uploads, and §8 is a placeholder. Terms: §6 repeats §5, the guardian line contradicts 18+, jurisdiction \"still being established\", nothing on the subscription's renewal. Every address is @psychmind.co, the app uses psychmind.org. Ideally a lawyer reads it.", where: AUDIT },
      { status: "todo", owner: "client", blocker: true, title: "Final copy review", detail: "The roughly 50 copy and consistency issues from the Figma audit (D27), \"thousands of verified psychologists\" (D26), and the How it works FAQ, whose placeholder answers promise an insurance filter, messaging and a cancellation policy.", where: "docs/build-plan/BUILD-PLAN.md §4" },
      { status: "todo", owner: "client", blocker: true, title: "Hero music licence", detail: "The track on the home page has no confirmed licence (TODO(client)).", where: "src/components/home/showcase.tsx" },
      { status: "todo", owner: "client", title: "Social links", detail: "Instagram, X and LinkedIn link to \"#\" in the footer and on /mission. Send the URLs, or they're hidden.", where: "src/components/shared/social-links.tsx" },
      { status: "todo", owner: "client", blocker: true, title: "Price, trial and extra-location fee (D9)", detail: "Moved from Milestone 1 so the client has time to decide. Figma shows $10/month on desktop and $39 on mobile, plus $5 per extra location. The Stripe price waits on this.", where: "src/lib/billing.ts" },
      { status: "todo", owner: "build", title: "Launch, then 30 days of bug fixes" },
      // 2026-11-09 audit and security plan (private, outside the repo).
      { status: "done", owner: "build", title: "Dependency updates", detail: "Updated 2026-11-10: next 16.4.5, zod 4.6.7 and npm audit fix; no critical or high advisories left (11 moderate, all in dev-only tools) (audit M4-01).", where: "package.json" },
      { status: "doing", owner: "build", blocker: true, title: "Retire or lock down the CMS", detail: "Locked down 2026-11-10: Decap pinned to 3.17.3 with an integrity hash, and the CMS and its GitHub sign-in refused on the admin host (audit M4-02). Still open: replace it with the blog editor in the admin console (Milestone 3).", where: "public/cms" },
      { status: "todo", owner: "accounts", blocker: true, title: "Domains and inboxes", detail: "Set up inboxes at psychmind.org for the addresses the site uses, then move the legal pages off psychmind.co (not owned; client approves the change), and add a DMARC record for psychmind.org (audit M4-03, M4-04).", where: PRIVATE_AUDIT },
      { status: "todo", owner: "accounts", blocker: true, title: "Repository settings", detail: "Make the repository private, turn on Dependabot alerts and security updates, and protect main (audit M4-05).", where: PRIVATE_AUDIT },
      { status: "todo", owner: "build", blocker: true, title: "Stripe go-live plan", detail: "Test mode on its own database (not production), the three Stripe variables set together, and providers told before billing starts (audit M4-10, M1-05; the notice and any grace period are the client's call).", where: "docs/live-testing.md" },
      { status: "todo", owner: "client", blocker: true, title: "Payment provider", detail: "To discuss (2026-11-10): Dee's team uses something other than Stripe. Billing is built on Stripe (subscription, grace period, customer portal, renewal terms), so the choice decides what the billing items below become." },
      { status: "todo", owner: "build", blocker: true, title: "Billing go-live fixes", detail: "Moved from Milestone 1 on 2026-11-10: every payment item waits on the client's choice of payment provider (her team uses something other than Stripe). If it stays Stripe, before it's switched on: an abandoned checkout leaves an \"incomplete\" row that hides Activate for good; \"Stripe on\" must require all three variables; founding providers who already pay; two checkouts both paid; the daily sweep stops on one failed email; the re-check never asks Stripe (audit M1-04, M1-05, M1-09 to M1-12).", where: "src/lib/billing.ts" },
      { status: "todo", owner: "build", title: "Personal data: logs and retention", detail: "No personal or health data in error logs (audit M4-07), and retention rules for guest requests, recovery IDs, sessions and subscribers once the client sets the periods (M4-08).", where: PRIVATE_AUDIT },
      { status: "todo", owner: "build", title: "Upload quotas", detail: "Per-account and recovery upload caps, and a cleanup that runs to completion (audit M4-09).", where: "src/app/api/uploads/route.ts" },
      { status: "todo", owner: "build", title: "Resilience", detail: "Timeouts on Resend, Stripe, Upstash and the database; a daily job that reports failures and runs billing first; an admin-only production config check (audit M4-11 to M4-13).", where: "src/app/api/cron/daily/route.ts" },
      { status: "todo", owner: "build", title: "Scale: search, photos and indexes", detail: "Search sends every listed profile on each filter click, photos are served uncached by a function, and subscription and several foreign keys have no index (audit M4-14, M4-15).", where: "src/server/directory/data.ts" },
      { status: "todo", owner: "build", blocker: true, title: "988 on /contact and the phone quick look", detail: "Both lack the crisis line, against the CLAUDE.md rule (audit M4-18).", where: "src/app/(contact)/contact/page.tsx" },
      { status: "todo", owner: "build", title: "Production hardening", detail: "security.txt, header tidy-ups, HSTS preload submission, preview deployment protection, the vercel.app host, APP_HOST, rate-limit store keys, migration safeguards, font and bundle weight, leftovers and dependency hygiene (audit M4-21 to M4-31).", where: PRIVATE_AUDIT },
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
      { status: "todo", owner: "build", title: "Patient request extras", detail: "Statuses beyond new and contacted (D18), withdraw, a request detail page, a sticky Request bar on phones, \"Who is this for?\" and preferred times (D22), and Undo on unsaving.", where: AUDIT },
      { status: "todo", owner: "build", title: "Provider extras", detail: "The changes-requested reason on each field, re-applying after rejection (D11), analytics loading and error states, and CSV export.", where: AUDIT },
      { status: "todo", owner: "build", title: "Admin extras", detail: "Search, paging and status filters on the lists, claim/lock in the queue, links to state licensing boards, and a reminder when a submission waits too long.", where: AUDIT },
      { status: "todo", owner: "build", title: "Account extras", detail: "Turning two-step login off and regenerating backup codes; keeping ?next= on the top Log in / Create account link and on session-expired redirects." },
      { status: "todo", owner: "build", title: "Site extras", detail: "Structured data, permanent (308) host redirects, 988 in the site footer, and Browse providers / For providers in the header menu." },
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
