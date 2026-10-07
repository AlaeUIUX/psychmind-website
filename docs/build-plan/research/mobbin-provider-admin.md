# PsychMind: Provider-side and admin gap analysis (Mobbin research)

**Purpose:** Find the patterns, states and steps the Figma does not yet cover for the provider dashboard, billing and admin console, so the build has fewer surprises.
**Source:** Mobbin MCP (web platform; iOS was not needed), compared against `figma/PROJECT_OVERVIEW.md` and the `figma/screenshots/s4_*` crops.
**Date:** 2026-10-07

> **Mobbin AI usage notice:** none of the Mobbin results in this research returned an `ai_usage_notice` field, so there is nothing to reproduce here.

> **Copy note:** PsychMind copy is client-approved. Never reword existing copy. Every new state listed below (banners, empty states, rejection messages, emails) needs **new copy, which must go to the client for approval**. This document describes what each message must say, not its final wording.

---

## 0. Top gaps, in priority order

1. **No provider account-status model in the UI.** The designs show only the "happy path, live" state (the Analytics header has a "Live" chip). The build needs these states, each with its own banner: draft, submitted / pending verification, changes requested, rejected, approved-but-unpaid, live, past-due (3-day grace), paused (hidden), cancel-pending, canceled, suspended, and license expired.
2. **Nothing after "Credentials & verification → Save and continue".** Missing: review & submit, attestation, a "submitted" confirmation, a pending dashboard, a changes-requested/resubmit flow, a rejection screen and an "approved, now activate your listing" payment step.
3. **No session-requests inbox or request detail page.** Only a "Recent session requests" widget exists on Analytics. Requests arrive by email with a "View request" link, so the deep-link target (with login redirect, request-not-found and not-yours states) is unbuilt. The same goes for the "contacted" / "not a fit" status controls that patients can see.
4. **Billing is about 10% designed.** The designs have a pricing card on the onboarding intro, an "Upgrade your plan" (additional locations) modal and a location-limit banner. Missing: Stripe Checkout handoff and return states, billing settings, invoices, card update, failed-payment banner with countdown, paused/hidden state, reactivation confirmation, cancel flow and restore.
5. **The admin console is not designed at all.** It needs: verification queue, license/document review, approve / request changes / reject with reason, provider directory, suspension, license-expiry tracker, blog moderation (if required), audit log, and staff roles.
6. **No settings area for providers.** Missing: login email/password/2FA, notification preferences, voluntary "pause listing", and delete account.
7. **The blog editor has no status model.** The list has no Draft/Published/In-review column, there is no moderation feedback, and there are no preview, SEO/slug, autosave or unpublish states.
8. **Empty, loading and error states are almost absent everywhere.** This covers analytics with no data, inbox with no requests, blog with no posts, upload failures and Stripe errors.

---

## 1. Method and caveats

- About 30 Mobbin searches, all on the web platform, with `output_destination: doc` throughout. Every result image was viewed; citations below link to the `mobbin_url`.
- **Health-specific apps are not indexed on Mobbin web.** A query naming Headway, Zocdoc and SimplePractice returned only Heidi (a clinical scribe), Jobber, Fresha, Kajabi and Time2book. The pro-marketplace analogues used instead are Jobber (requests), Airbnb (listing editor), Contra/Fiverr/Upwork (pro profiles), Stripe/Airwallex/Mercury (verification), and Deel/Aboard/Remote (approval consoles).
- The Figma review was done from screenshot crops. Small labels were not always legible, and items marked "could not confirm" should be checked in Figma directly.

---

## 2. Baseline: what the Figma already covers (provider side)

| Area | Seen in Figma (s4 crops) |
|---|---|
| Role select / sign-up | "Who are you joining as?" (client vs provider, "I accept insurance" checkbox), provider create-account form with business name |
| Onboarding intro | "Reach people who are ready to start" card: $X/month base plan, cancel anytime, manual verification in 1–2 days, no commission, patient data stays private, "Takes about 10 minutes", Get started |
| Wizard steps ("Step N of 5") | Your identity (photo upload + live profile preview pane), Your story (bio), Your expertise (chips/specialties), Practice locations (per-location rows, plan-limit banner "You've reached your N location limit / Upgrade for more", "License compliance" side note), Credentials & verification ("Final step": per-state accordion with license document upload, license #, NPI #, issuing body, years of experience; "Save and continue" / "Go back") |
| Plan modal | "Upgrade your plan": Basic plan (included locations) vs upgrade (+$ per additional location, quantity input) |
| Analytics | Date range (Last 7 days / 30 days / 3 months / Custom), KPI tiles with deltas (conversion rate, impressions, profile views, session requests, saves), "How patients found you" keyword bars, trend chart with metric selector, "Recent session requests" list, View public profile / Edit profile buttons, "Live" chip |
| Public profile | Full profile rendered with a "This is a preview" chip. **Could not confirm a separate edit form**: editing may reuse the wizard steps. |
| Blogs | "Your blogs" list (title, date posted, category, Delete/Edit, Add blog) and a block editor (H2, Paragraph, Image, Bulleted list, Quote, "Add block" chips) with a Publish settings card (Status: Draft, Author, Date, Category, "Publish now", "Save as a draft") |

---

## 3. Cross-cutting requirements

### 3.1 Provider account state machine (must be designed before the screens)

| State | Trigger | Public listing | Provider sees | Primary CTA |
|---|---|---|---|---|
| `draft` | Sign-up, wizard incomplete | Hidden | Resume-onboarding checklist | Continue setup |
| `submitted` (pending verification) | Submit | Hidden | Pending banner + timeline (submitted → in review → decision, "1–2 business days") | Preview profile / write first blog |
| `changes_requested` | Admin requests changes | Hidden | Error banner + per-field reasons | Fix and resubmit |
| `rejected` | Admin rejects (final) | Hidden | Rejection screen + reason + support contact | Contact support |
| `approved_unpaid` | Admin approves | Hidden | "You're verified, activate your listing" | Start subscription (Stripe Checkout) |
| `live` | Payment succeeded | Visible | "Live" chip | — |
| `past_due` (grace) | Invoice payment failed | **Visible for 3 days** | Persistent warning banner with countdown, plus an email | Update payment method / Pay now |
| `paused` (billing) | Grace expired | Hidden from search | Error banner "hidden from search" | Pay now. Goes live **instantly** on payment. |
| `cancel_pending` | Provider cancels | Visible until period end | Banner with end date | Restore subscription |
| `canceled` | Period ends | Hidden | Expired plan card | Resubscribe |
| `suspended` | Admin action | Hidden | Suspension notice + reason + support | Contact support (no self-serve) |
| `license_expired` (per license / state) | Expiry date passes | Hidden for that state (or entirely, if it was the only license) | Banner listing expired licenses | Upload renewed license |

Notes:
- Statuses combine: a provider can be `live` in TX while a NY license is `pending`. Show **per-license status** inside Credentials.
- Pick one global **status banner component** (info / warning / error / success variants, plus an optional countdown and CTA) and one **status chip** for the dashboard header. References: Customer.io account-review banner ([link](https://mobbin.com/screens/25eb3dc6-8fb5-4b98-a213-7503d661e8ab)), Kajabi pending-cancellation banner ([link](https://mobbin.com/screens/8704617e-3b2c-4487-a443-8e87beb5e09c)), ManyChat expired top bar ([link](https://mobbin.com/screens/03b30f47-6ee9-449c-80cc-58456bf3d871)), Whop "we need more info, you can still..." banner, which states both the consequence and what still works ([link](https://mobbin.com/screens/2b7de26a-c8b2-4f7d-b6e7-8bac88b0d284)).
- **Decide what a hidden profile's direct URL shows to patients.** Options are a 404, "not currently accepting requests", or still viewable but without the request button. Also decide what happens to patients who saved that provider.

### 3.2 Shared UI states every dashboard page needs
- Skeleton loading. Error with retry. 403 (wrong role or not your resource). 404. Session-expired → re-login → return to the same URL.
- Toasts for save/success/undo. Confirm dialogs for destructive or patient-visible actions.
- Mobile layout: providers will open "View request" from email on their phones.

---

## 4. Feature 1: Professional onboarding wizard (save/resume, upload, review & submit, pending, rejected)

### References reviewed
- Airwallex "Verifying ID" flow: section nav with checkmarks, **Save for later** next to Submit, upload card with % progress, View/Remove, file-type/size hint, per-person status badges ("Electronically verified", "Submitted"), read-only review with eye icons ([flow](https://mobbin.com/flows/4ddfb2ef-818d-416c-b963-1dedf5c91aa9))
- Airwallex "Submitting an application": attestation checkboxes, signature, then a dashboard reading "Your application is being processed… within 1–3 business days" while the rest of the app stays explorable ([flow](https://mobbin.com/flows/f9ab9e5f-9ef2-4412-a254-8edf2232ecf1))
- Mercury "Uploading company documents": "4/6" counter + step list, document-type select, drag-and-drop zone, uploaded preview + green check ([flow](https://mobbin.com/flows/9e56fcb4-084c-4ada-98a0-48e049ddb2bd))
- Mercury "Submitting an application": "Review Your Application" → legal agreements → "Agree and Submit", then "You're nearly there!" with an **Application timeline** (Apply submitted on date → In review ~1 day → Account ready), a support email, and optional tasks to do while waiting ([flow](https://mobbin.com/flows/f46b27fd-c406-44ec-ab64-d2e0b7219966))
- TikTok "Registering a business": 3-step stepper, then a read-only submitted record with banner "under review. We'll notify you via inbox or email" ([flow](https://mobbin.com/flows/02c86e73-5b50-4860-b8d0-21df2534a03e))
- Stripe "Information required": top error banner + **field-level** explanation of what failed and how to fix it, prefilled data with edit icon ([screen](https://mobbin.com/screens/0da270e9-0831-44ad-8bd5-ff15a0cefc23))
- PayPal upload error: red drop zone + "Uploaded file is incorrect" inline ([screen](https://mobbin.com/screens/51b7bb9e-116b-4004-984f-cb38b6f00d90))
- OKX "Verification unsuccessful": specific reason + exact requirements + Try again ([screen](https://mobbin.com/screens/60191918-296f-4779-9d82-df580b3a1c41)); Upwork "Try again after reviewing our tips" ([screen](https://mobbin.com/screens/790aed80-c659-4982-8cde-ddf209da6f4c)); Uvodo/Stripe Identity capture failure with tips ([screen](https://mobbin.com/screens/3b3536ad-f788-4718-a0ed-3a6e3c07bfae))
- Resume-setup checklists: Substack ([screen](https://mobbin.com/screens/73b297c2-e58e-4b05-b64b-48001a69e072)), Fresha "continue setting up, 1 of 5, 60%" ([screen](https://mobbin.com/screens/d91503ac-a943-46de-b72a-357800c84082)), Mailchimp ([screen](https://mobbin.com/screens/dd150d11-9cb3-4cc0-8bd3-f3ebbf9c7b6e)), Copilot ([screen](https://mobbin.com/screens/297c2971-e2d8-412d-8095-3885d993d668))

### Best-fit pattern for PsychMind
Keep the existing card-plus-live-preview wizard. Add three things:
- A **Mercury-style step list** so users can jump between steps and see per-step completion.
- An **Airwallex-style "Save & exit"** (autosave on every "Save and continue").
- A **Mercury-style review → attest → submit → timeline** ending.

For failed verification, use **Stripe-style field-level "changes requested"** rather than a generic rejection. Most license issues are fixable (blurry scan, wrong number).

### Build checklist
**Steps**
- [ ] Email verification after sign-up, before the wizard (not seen in Figma)
- [ ] Wizard step list / progress (desktop sidebar, compact "Step N of 5" on mobile) with done / current / incomplete / error per step
- [ ] Confirm every business-rule field has a home: about/bio, specialties, **preferred (top) specialty**, approach/modalities, who they work with, online vs in-person, **session languages**, **fees** (individual / couples), insurance carriers (sign-up has an "I accept insurance" checkbox, but no carrier picker was seen). *Fees, languages and approach could not be confirmed in the wizard crops.*
- [ ] Review & submit page: all sections read-only with "Edit" links back to each step; documents listed with name/size/view
- [ ] Attestation checkbox(es): info accurate, license in good standing, Terms (copy needs client approval)
- [ ] Submit confirmation, then a **pending verification dashboard** with timeline and expected time (the intro already promises "1–2 days")
- [ ] "While you wait" tasks: preview profile, draft a first blog post, set notification preferences
- [ ] Approved state → "Activate your listing" → Stripe Checkout (see Feature 5)

**States**
- [ ] Autosave / draft resume. On returning after login, land on the first incomplete step. Show "Saved" / "Saving…" / "Couldn't save, retry".
- [ ] Upload states: empty, drag-over, uploading (progress %), success (thumbnail/filename/size, View, Replace, Remove), errors (wrong type, too large, unreadable or password-protected PDF, network failure), multiple files per license (front/back or multi-page)
- [ ] Per-license (per-state) status inside Credentials: not started, complete, submitted, verified, changes requested, rejected, expiring, expired
- [ ] **Changes requested:** banner at top + affected step(s) flagged in the step list + inline reason on the exact field/document + "Resubmit"
- [ ] **Rejected (final):** reason, what it means (not listed), support contact, and whether re-application is allowed
- [ ] Locked/read-only fields while `submitted` (credentials should be locked, bio editable?). Decide and show a lock hint.

**Edge cases**
- [ ] Field validation: license # format per state, NPI 10-digit with checksum, required vs optional
- [ ] Name on ID ≠ name on license (prompt for an explanation or a legal-name field)
- [ ] Adding a new state/location after going live triggers verification **for that license only**. The profile stays live in verified states.
- [ ] Editing a verified credential (license #, name) after approval: does it re-trigger review? Show a warning before saving.
- [ ] Plan location limit reached mid-wizard (banner exists) → upgrade modal. Decide whether this takes payment before approval (see Feature 5 decision).
- [ ] Abandoned wizard: reminder emails at, say, 1 / 3 / 7 days
- [ ] Mobile camera capture for documents (the `accept` and `capture` attributes)

**Missing from Figma:** email verification, step navigator, Save & exit, upload progress and error states, review & submit, attestation, submitted confirmation, pending dashboard, changes-requested, rejected, approved/activate, per-license statuses.

---

## 5. Feature 2: Public profile editor with live preview

### References reviewed
- Airbnb Listing editor: left column of **section summary cards** (each shows its current value or "Add details"); the right pane edits one section; per-section **Save is disabled until dirty**; "Changes saved" toast; floating **View** button; character counter ("18/113 available"); "Complete required steps" callout with red dot ([screen](https://mobbin.com/screens/2f6ce85f-86b6-4a96-b19f-cd717544adf7), [screen](https://mobbin.com/screens/4b427413-1a53-4df8-84bd-a7f4e13f1103), [screen](https://mobbin.com/screens/d3fb097f-a4e7-43be-a24a-a3e26c185ba7), [screen](https://mobbin.com/screens/9c3ff546-9537-4494-afc5-dded8925fdab), "3 photos added" toast [screen](https://mobbin.com/screens/f9bb1773-52bd-4158-82fb-4340ed6aa13e))
- Contra profile completion: "Unlock discoverability by completing your profile. Once you're done, you'll start appearing in search results", plus a checklist drawer ([screen](https://mobbin.com/screens/33f72505-df46-40ac-a916-3b649be52606))
- Fiverr: completion-rate bar; **"Private" label** on fields that are not shown publicly ([screen](https://mobbin.com/screens/2cc1e67f-b569-4f20-9dbe-d7b9b66ec78e))
- Aboard: "Missing" tags + "Please update highlighted fields" ([screen](https://mobbin.com/screens/e7ec3d77-383c-4b9f-ad94-24ff6344a45e)); TravelPerk "Last update on …" + 3/6 checklist ([screen](https://mobbin.com/screens/691bd9f4-3058-4161-a409-6dc52693f106))
- Unsaved-changes guards: Customer.io "Just a minute! You have unsaved changes" (Go back / Discard / Save & Continue) plus a "Last saved a few seconds ago" header ([screen](https://mobbin.com/screens/25eb3dc6-8fb5-4b98-a213-7503d661e8ab)); Toggl ([screen](https://mobbin.com/screens/4af9d4cb-f2d7-4037-95f7-400343b15ce7)); Klaviyo warning that a change will affect something **live** ([screen](https://mobbin.com/screens/4bb085db-e123-4ee6-92a8-e387371e9afd))

### Best-fit pattern for PsychMind
Use the **Airbnb listing-editor model** after onboarding: section cards on the left (Identity, Story, Expertise, Who I work with, Approach, Format & locations, Languages, Fees, Credentials), the edit form on the right, and the existing **live preview** as a toggle or a third column on wide screens. Reuse the wizard step components so there is one source of truth. Add a **Contra-style completeness meter** that explains the search-visibility benefit.

### Build checklist
- [ ] Profile status chip (Live / Pending / Paused / Hidden / Suspended) + "View live profile" (opens the public URL in a new tab; disabled when not live, with an explanation)
- [ ] Per-section dirty tracking; Save disabled until changed; "Saving…" / "Saved" / failed save with retry
- [ ] Unsaved-changes guard on route change and tab close (`beforeunload`)
- [ ] **Re-verification warning** before saving credential-sensitive fields (name, license, NPI, new state). Every other field publishes instantly.
- [ ] Field-level validation + character counters (bio min/max), chip limits (max specialties), exactly one "preferred specialty"
- [ ] Photo upload: crop/reposition, size/type errors, removal, fallback avatar
- [ ] Preview toggle: desktop/mobile width; the preview shows the patient-facing state (for example, a fee "Not listed" placeholder)
- [ ] Completeness meter + list of missing items that link to each section
- [ ] Private vs public labelling on fields (for example, the license # may be public, but the documents and NPI may not be)
- [ ] Optional "Not accepting new clients" toggle (common on therapist directories; needs a business decision)
- [ ] Concurrency: the profile edited in two tabs → last-write-wins warning
- [ ] Read-only mode when suspended; limited edits while pending

**Missing from Figma:** a post-onboarding edit surface. The "Your public profile" page appears to be preview-only with "Edit profile". The designs also lack save/dirty/error states, the unsaved-changes dialog, the re-verification warning, the completeness meter, and status-dependent variants of the profile page.

---

## 6. Feature 3: Analytics for a listing owner

### References reviewed
- Peerlist profile analytics: date dropdown, profile views + clicks ([screen](https://mobbin.com/screens/b48c318e-d89a-4358-b822-f9e0fa7da189))
- Wix "Traffic over time": explicit **"Compared to Jul 8 – Aug 6"** label, "Show report definitions", "just now" freshness + refresh, Line/Bar/Table toggle ([screen](https://mobbin.com/screens/5d4a9582-7abb-47d8-b555-021df563a0ec))
- Seline: "0% vs previous 30 days", calendar range picker ([screen](https://mobbin.com/screens/4e47be94-6871-46ed-b703-eeae23153be4))
- HoneyBook lead-source breakdown + "PRO TIP: to capture more leads…" ([screen](https://mobbin.com/screens/20d3f1d0-04fa-48a8-9883-c751e22e8775))
- Kajabi page views with a **"No Data"** donut placeholder per widget ([screen](https://mobbin.com/screens/6bb4cba1-27f1-4590-88f8-85b90c1ec5c2)); Contra discovery score + "Improve profile" ([screen](https://mobbin.com/screens/306564f1-0d83-4a56-ab3c-c56a3ae28bd2))
- Empty/low-data: Copilot "Metrics will show after you create 10 clients (3/10 so far)" over a ghost chart ([screen](https://mobbin.com/screens/297c2971-e2d8-412d-8095-3885d993d668)); Flodesk "Checkout insights are 3 steps away" numbered steps + CTA ([screen](https://mobbin.com/screens/9e5d3750-0a5b-40b5-8190-5a2c201edf83)); Hotjar "No highlights yet. When you…, you'll see them here" ([screen](https://mobbin.com/screens/b7f0324f-417c-4b7d-9c7a-1ee050a78f16)); Steep "Get started" ([screen](https://mobbin.com/screens/befce3e9-03ba-47d4-b4bc-5ecd3b647d8c))

### Best-fit pattern for PsychMind
The Figma analytics page is already strong. Add three things:
- **Wix-style comparison labelling and data freshness**
- **Copilot-style threshold empty states** (ghost chart + "data appears once your profile has been live for N days / N impressions")
- **HoneyBook-style actionable tips** next to weak metrics (for example, few profile views → "add a photo / complete specialties")

### Build checklist
- [ ] Pre-live state (draft/pending/approved-unpaid): analytics locked with an explanation and the next action
- [ ] New-live / zero-data state: ghost chart, "Your first insights will appear here", tips to improve visibility
- [ ] Low-data / threshold state, especially for **search keywords**. Patient search terms can be sensitive (for example, "suicidal thoughts"). Suppress keywords below a minimum count (k-anonymity) and never show patient identity.
- [ ] Per-widget loading skeleton, error + retry, "Updated X ago"
- [ ] Comparison period label on deltas ("vs previous 30 days"); handle a 0 → N delta (show "New" instead of ∞%) and divide-by-zero conversion ("—")
- [ ] Metric definitions tooltip (impression vs profile view vs save vs request; conversion = requests ÷ views?)
- [ ] Custom range picker: max range, no future dates, start ≤ end, timezone label
- [ ] Paused or canceled periods annotated on the chart (shaded band "Profile hidden"), so drops are explained
- [ ] Multi-location providers: filter by location/state? (decide)
- [ ] Mobile: KPI tiles stack, chart becomes scrollable or simplified, keyword list truncates with "View all"
- [ ] "Recent session requests" widget: empty state + "View all" link to the inbox (Feature 4)

**Missing from Figma:** empty/pre-live/low-data states, loading/error, data freshness, comparison label, metric definitions, keyword privacy threshold, paused annotation.

---

## 7. Feature 4: Session-requests inbox (no messaging)

### References reviewed
- Jobber Requests list: an **Overview card with counts per status** (New / Assessment complete / Overdue / Unscheduled), "New requests, past 30 days" with delta, conversion rate, table (client, title, contact, requested date, **status pill**), Status filter + date filter + search ([screen](https://mobbin.com/screens/a6fb2d6f-b990-48c4-91c0-9a4dac929ea4))
- Jobber Request detail: status pill at top, **client card with phone + email links**, requested date, form answers ("Service details", "Your availability", preferred times), private notes panel with edit history ([screen](https://mobbin.com/screens/19ac56a2-4e6f-4c99-aa80-02c6eed8d5b3), [screen](https://mobbin.com/screens/bc225e02-65e9-4865-8baf-3dc5ab47b7ff), empty sub-sections [screen](https://mobbin.com/screens/d96783f8-af5d-471c-9924-8a647553a2ab))
- Dribbble "Decline project request?" with an optional message ([screen](https://mobbin.com/screens/24740592-4952-4237-8a45-05fc65d530a0))
- Status-tabbed inboxes: Plain (Todo / Snoozed / All statuses + counts) ([screen](https://mobbin.com/screens/3382cb8f-e08c-4e6f-9a10-76fad83d9680)), Gorgias (filters, bulk actions, last-message time) ([screen](https://mobbin.com/screens/58b46bc3-dac8-4d4c-bdfe-219d0878a647))
- Empty states: Workable "There are no applications… at the moment" + checklist of what to do + CTA ([screen](https://mobbin.com/screens/7cde1ac1-4c0e-4de9-8ce6-bfd885a0761c)); Upwork Active/Referrals/Archived tab empty ([screen](https://mobbin.com/screens/b071f36d-f58a-41e8-a7c1-467ef8abfaef)); Polywork "You have no outstanding requests" ([screen](https://mobbin.com/screens/f3acf5e8-88d3-492c-944e-60f97e7ac81a))

### Best-fit pattern for PsychMind
Use a **Jobber-style list and detail**, adapted for "no messaging":
- **List:** status tabs New / Contacted / Not a fit / All, with counts.
- **Detail:** the patient's submitted info, then **"Email patient" (`mailto:`) / "Call" (`tel:`) / Copy** actions, then a status control. Choosing "Contacted" can be prompted after the provider clicks email or call.
- **"Not a fit":** confirm dialog (Dribbble-style), because the patient sees the status.

### Build checklist
**Pages and steps**
- [ ] Inbox page (nav item with an unread "New" count badge)
- [ ] Request detail page = the target of the email "View request" link (`/dashboard/requests/[id]`)
- [ ] Status change: New → Contacted / Not a fit. Decide whether a change is reversible (Contacted → Not a fit?) and whether "Not a fit" carries a patient-visible reason or a referral suggestion.
- [ ] Undo toast (5–10 s) before a patient-visible status is committed, or a confirm dialog for "Not a fit"
- [ ] Status history timeline on the detail page (received, viewed, contacted on date)

**States**
- [ ] Empty inbox (never had a request): explain how requests arrive (email + dashboard), link to profile completeness
- [ ] Empty filtered tab ("No requests marked Not a fit") + clear filters
- [ ] Unread/new indicator; "Received 3 days ago, still New" aging nudge
- [ ] Loading skeleton, error + retry
- [ ] Deep link: logged out → login → redirect back; request belongs to another provider → 404 (do not leak existence); request deleted or withdrawn by the patient → explanatory state; email link opened on mobile → responsive detail
- [ ] Account paused/canceled/suspended: can the provider still view past requests and update status? (decide; probably yes, read and update allowed)

**Edge cases and privacy**
- [ ] Patient data minimization: show only what the patient submitted; no patient account details; no analytics linking a keyword to an individual
- [ ] Data retention: auto-archive or delete requests after N months? (decide)
- [ ] Copy-to-clipboard for email/phone (mailto can fail on desktop without a mail client)
- [ ] Optional private notes (Jobber pattern). Caution: notes may contain PHI, so consider skipping them for v1.
- [ ] Search/sort (newest, oldest New first) and pagination

**Missing from Figma:** the entire inbox list, request detail, status controls and confirmation, every empty/error/deep-link state, nav badge, and the patient-facing status display (that one belongs to the client-side research, but it must stay consistent with this).

---

## 8. Feature 5: Subscription billing (Stripe)

### References reviewed
- Billing settings: Claude (plan + auto-renew date, card + Update, invoices table with status + View, Cancellation section) ([screen](https://mobbin.com/screens/40cea7ff-83cc-4a74-9232-cc8390595269)); Podia (next invoice date + amount, "Stored securely with Stripe", Manage menu: change plan / switch to yearly / view invoices / cancel) ([screen](https://mobbin.com/screens/cdd7f5b9-f272-4af9-8211-23977deec37f)); Mural (usage "1 of 1 memberships", price, billed-to card, billing address, **Status: Active**) ([screen](https://mobbin.com/screens/01cb0390-d5d3-4cf3-86a6-03f91f2c51c3)); Profound (billing history with status + download) ([screen](https://mobbin.com/screens/4016a872-372c-48e4-916c-70d4a85dff26)); PandaDoc (Pay now, apply coupon) ([screen](https://mobbin.com/screens/bc08f602-5337-4802-9a38-27f78c13e788)); Canny ([screen](https://mobbin.com/screens/856d06a3-14ee-426e-aa5f-ff2e08db4bd3))
- Dunning and expired: Slite "Your subscription is incomplete: initial payment did not succeed", INCOMPLETE tag, "Go to invoices" ([screen](https://mobbin.com/screens/34392e14-4e35-436b-af7b-918b2906e72f)); ManyChat expired banner + "Renew" ([screen](https://mobbin.com/screens/03b30f47-6ee9-449c-80cc-58456bf3d871)); Kajabi "pending cancellation… Restore my account" ([screen](https://mobbin.com/screens/8704617e-3b2c-4487-a443-8e87beb5e09c)); Google Ads update-card dialog + "verify your card information and try again" error + backup payment method ([screen](https://mobbin.com/screens/42ba46c4-ef14-4940-af86-d35884bc0db1)); Wix "Retry payment methods during grace period" ([screen](https://mobbin.com/screens/e3edaaf5-1832-4828-97cf-201b86b65c2c))
- Cancel flows: Disney+ (Pause vs Cancel → "Ok, your subscription has been cancelled… continue until date" + **Restart Subscription** + optional reason survey) ([flow](https://mobbin.com/flows/07613377-f2a2-45b1-8440-c422450b41ab)); Synthesia ("Why do you want to cancel?" + "You'll be locked out from…", "Stay on this plan", then a top banner "subscription will expire on date | Reactivate") ([flow](https://mobbin.com/flows/b4339fec-c5ae-4a76-80f0-43d7696951fe)); ManyChat (nested reasons, "I Change My Mind") ([flow](https://mobbin.com/flows/37f9d50a-7c03-4c17-879f-6cef816c1873)); Jasper ("Your subscription ends on date. Your payment method will no longer be billed.") ([flow](https://mobbin.com/flows/63dd973e-790b-4163-b21d-718750a69ce6))
- Stripe Checkout layout (plan summary left, card form right, promo codes, confirmation page vs redirect): ([screen](https://mobbin.com/screens/75aeafb8-07dd-47ed-a0d0-ac076de8e3cd), [screen](https://mobbin.com/screens/f3d0a91f-6277-46f2-99b5-f6481f3e5a43))

### Best-fit pattern for PsychMind
- Use **Stripe Checkout** for the first payment and **either the Stripe Customer Portal or a light custom Billing page in Claude/Podia style** for plan, card, invoices and cancellation. The portal saves build time. A custom page keeps branding and lets you show the listing status next to billing.
- Use a **global dunning banner** (Kajabi/Synthesia-style top bar) whose wording escalates: grace (warning with countdown "paused in N days") → paused (error, "hidden from search") → recovered (success toast, "You're live again").
- Use a **Disney+/Jasper-style cancel**: cancel at period end, an optional reason, and a clear "Restore" CTA until the period ends.

### Build checklist
**Steps**
- [ ] Approved → "Activate your listing" page (plan summary: base price + additional locations × price) → Stripe Checkout → return URL
- [ ] Return states: success-and-confirmed ("You're live"), **processing** (webhook not yet received; poll and show a spinner, "Finishing up…"), canceled checkout (back to the activate page, nothing charged), failed/declined (Stripe handles the retry, but the return page must handle `?canceled`)
- [ ] Billing page: plan name, price breakdown (base + N locations), status, next charge date + amount, card brand/last4/expiry + Update, billing address/tax (if needed), invoices list (date, amount, status Paid/Failed/Open, PDF), Cancel
- [ ] Change the number of locations: proration preview ("You'll be charged $X today"); downgrade below the current location count forces the provider to choose which location to remove
- [ ] Cancel flow: consequence statement (hidden from search on date; requests stop; blogs?), optional reason, confirm → cancel-pending banner with Restore
- [ ] Resubscribe after cancellation or expiry

**States**
- [ ] `past_due` banner on **every** dashboard page during the 3-day grace period, with countdown + "Update payment method" + "Retry payment now"
- [ ] `paused` banner + header chip + analytics annotation; the public profile is hidden; "Pay now to go live instantly"
- [ ] Reactivated success state (toast/banner) once the webhook confirms payment
- [ ] SCA/3-D Secure "authentication required" (Stripe `requires_action`) → send to the hosted invoice page
- [ ] Card expiring soon (warning 30 days before)
- [ ] Invoice list empty (first month), loading, error

**Edge cases**
- [ ] **Decide when the card is collected.** The Figma shows the plan/upgrade modal *during* onboarding (Practice locations), but the business rule says payment happens *after* approval. Avoid charging for an unverified provider; refund rules if rejected.
- [ ] Approved but never paid → reminder emails; does the approval expire?
- [ ] Admin-suspended provider with an active subscription → pause collection or cancel and refund? (decide)
- [ ] Webhook delays and duplicates (idempotency); a manual "refresh status" for the admin
- [ ] Taxes (Stripe Tax?) and receipts emailed by Stripe vs PsychMind
- [ ] Coupons/promos (Checkout `allow_promotion_codes`) for launch offers?

**Missing from Figma:** everything except the intro pricing card, "Upgrade your plan" modal and location-limit banner. That means no activate page, Checkout return states, billing page, invoices, card update, dunning banner, paused state, reactivation confirmation, cancel flow, restore or resubscribe.

---

## 9. Feature 6: Admin console (verification queue, review, suspension, license expiry, audit)

### References reviewed
- Queues: Deel "Action required (71)" nav badge, filters (status, submitted date, type), row-level approve/deny icons, bulk "Approve all your pending" ([screen](https://mobbin.com/screens/ebede796-0ca0-408a-bf05-630420732e1f)); StackAI **Pending (1) / Approved (0) / Rejected (0)** segmented tabs ([screen](https://mobbin.com/screens/3ee3b3f3-ee96-480d-bb21-17369bed1b03)); Aboard approvals table (status pill, next approver, requested date) ([screen](https://mobbin.com/screens/9ce069a2-2cbe-4c94-a7f5-b57050e50ca0)); Miro access requests ("Expires in 26d" under the date) ([screen](https://mobbin.com/screens/05e59db8-5f5a-4f08-ae23-292fd64fe663)); Calendly pending users ([screen](https://mobbin.com/screens/3cd7e903-497a-4087-aa32-e4efd0ba2810)); Homerun All / In process / Hired / Disqualified ([screen](https://mobbin.com/screens/c4ce5f75-da60-4a2d-b15d-df5cc1ef5739))
- Review detail with document viewer: Aboard (**document left, details + approval timeline right, sticky Reject / Approve**) ([screen](https://mobbin.com/screens/d15cd548-a758-4743-8944-99c825340019)); Remote (PDF viewer with download/view, "Awaiting approval", timeline, Decline, View profile) ([screen](https://mobbin.com/screens/5a02d53a-4cc4-411a-ba45-3d0b7c1f0f54)); Mercury (zoom + / − / Reset, open in new tab, download; timeline with actor) ([screen](https://mobbin.com/screens/60364c06-7c88-4ac9-a5e2-cf1041ab4e84)); Revolut (full PDF viewer with page thumbnails) ([screen](https://mobbin.com/screens/1180d5ee-a7bc-45f2-bb0f-03a09b51859a))
- Reject with reason: Deel (**required Reason dropdown**, candidate summary card, Reject disabled until a reason is chosen) ([screen](https://mobbin.com/screens/5468f0b0-3c76-4d96-98b9-52f3d85d214e)); Employment Hero ("will be notified of this reason and status updated to Declined") ([screen](https://mobbin.com/screens/034c720d-c86a-491f-a1ce-2896987a5e07)); Docusign (0/500 counter) ([screen](https://mobbin.com/screens/e9164b60-801f-4221-9013-d0f396766a42)); Oyster (request summary inside the reject modal) ([screen](https://mobbin.com/screens/6ff73093-4225-4afa-a549-19298e447583))
- Suspend/deactivate: WorkOS (user profile tabs Details / Sessions / **Events**, reversible deactivate, separate Danger zone delete) ([screen](https://mobbin.com/screens/5fe68a16-a920-4dce-b048-90649bf81498)); Okta (consequences under "Important") ([screen](https://mobbin.com/screens/eaf5ce0f-9a10-4324-a9f1-a9097f7ff2ce)); Zoho (bulleted consequences) ([screen](https://mobbin.com/screens/ce24cbb4-943d-47d5-b6b5-e2fcbec282f0)); Deputy (**"Notify user by email" checkbox**) ([screen](https://mobbin.com/screens/ce853850-776e-4d7f-b7b1-d780f2320ddd)); Mural (target summary card) ([screen](https://mobbin.com/screens/72184367-08da-465e-9b6a-dfb0448fe354))
- License/document expiry: 7shifts Certifications (person, location, type, status "Valid", expiration date, file, status filter, Export CSV) ([screen](https://mobbin.com/screens/806539a9-f62a-44fd-aad4-db4283e65b31)); Vanta ("Expired on date" pill, Expired group) ([screen](https://mobbin.com/screens/bb351136-3617-42fc-bd61-bd47403c2710)); Deel compliance KPI cards (Not submitted / Incomplete / Completed) + "Send message" per row ([screen](https://mobbin.com/screens/9feb7477-a0de-46c4-8e31-a3117eb1162c)); Slite **quick-filter KPI tiles** (Outdated / Verification expired / Verification requested / Empty) ([screen](https://mobbin.com/screens/784fd37d-3429-4f47-b58c-0b6fc0ffed07))
- Audit log: Front (date range, updated-by, resource, event filters, Export, "Last updated just now · Refresh", explainer panel) ([screen](https://mobbin.com/screens/0c2efddc-d2d9-4a17-b589-34523d08e1d8)); PlanetScale (human sentence + machine event code + IP + actor filter) ([screen](https://mobbin.com/screens/d7448333-6400-49dd-b11f-e48e4e229200)); Fibery (**"What changed" field diff column**) ([screen](https://mobbin.com/screens/e2d656a6-35ba-4e9a-b5c7-a14e4fa61bb3)); 1Password ([screen](https://mobbin.com/screens/d015635b-1d0a-4357-9281-2c863bf010de)); Gorgias ([screen](https://mobbin.com/screens/44a16fee-609a-40a5-afa0-f901dcacdfa8))
- Stripe dashboard (subscriptions filtered Active / Scheduled / Cancelled; transactions Succeeded / Failed): the owner can deep-link here instead of PsychMind rebuilding billing admin ([flow](https://mobbin.com/flows/c879c167-7f59-4b50-9275-20aa31c7e7be), [flow](https://mobbin.com/flows/bfa4b190-4b87-42e2-8f6d-968d7c382630))

### Best-fit pattern for PsychMind
A small, Linear/Vercel-plain console with these pages:
1. **Overview:** Slite/Deel-style KPI tiles that act as filters: Pending review, Waiting > 2 business days (the SLA promised on the intro), Changes requested, Licenses expiring ≤ 30 days, Expired, Past due / Paused, Suspended.
2. **Verification queue:** StackAI-style tabs with counts. Oldest first. **No bulk approve**, because license verification must be individual.
3. **Review page:** Aboard/Remote split. Document viewer on the left. On the right: provider details, a license table per state, a **"Verify on state board" external link and copy buttons for license # / NPI**, a name-match hint, a timeline, and a sticky footer with **Approve / Request changes / Reject**.
4. **Provider directory and provider detail:** WorkOS-style tabs: Overview, Licenses & documents, Billing (read-only status + "Open in Stripe"), Requests (counts only), Blog posts, Activity.
5. **License expiry tracker:** a 7shifts-style table.
6. **Audit log:** Front/Fibery-style.
7. **Team:** owner invites staff and assigns roles.
8. **Settings:** canned rejection/changes-requested reasons (Reddit "Saved Responses" idea).

### Build checklist
**Verification queue**
- [ ] Tabs: Pending / Changes requested (awaiting provider) / Approved / Rejected, with counts; search by name, email, license #, NPI; filter by state; sort by submitted date
- [ ] Waiting-time column ("3 business days"), with an SLA breach highlight
- [ ] **Claim/lock:** "Being reviewed by Sam" so two staff don't review the same provider; release on leave or timeout
- [ ] Resubmissions re-enter the queue, flagged "Resubmitted", with a diff of changed fields/documents
- [ ] Empty queue state ("All caught up"); loading; error

**Review page**
- [ ] Document viewer: PDF multi-page + images, zoom, rotate, fit, download, open in new tab; unsupported/corrupt file state; documents served via short-lived signed URLs (never public)
- [ ] Per-license decision (approve the TX license, request changes on NY), plus an overall provider decision
- [ ] Approve: confirm → provider moves to `approved_unpaid` → email sent
- [ ] Request changes: **required reason** (canned + free text, which field/document), patient-safe wording, preview of the email the provider will receive
- [ ] Reject (final): required reason + internal note (not sent) + confirm
- [ ] Internal notes thread on the provider (staff-only)
- [ ] Optional license expiry date entry at approval (feeds the expiry tracker)

**Suspension and user management**
- [ ] Suspend: reason (required), consequences list (hidden immediately, cannot receive requests, billing effect), "Notify provider by email" checkbox, confirm; reversible Unsuspend
- [ ] Hard delete separated into a Danger zone, owner-only; handle the Stripe subscription and blog posts
- [ ] Read-only "View as provider" (impersonation) is optional and must be audited

**License expiry**
- [ ] Table: provider, state, license #, expiry date, days left, status (Valid / Expiring / Expired / Renewal submitted)
- [ ] Automated provider reminders (60/30/7 days) + an admin "Send reminder" action
- [ ] On expiry: auto-hide for that state (decide on manual vs automatic), banner to the provider
- [ ] Renewal upload → lightweight review (does not hide the profile while still valid)

**Audit log**
- [ ] Immutable entries: actor (staff/owner/system/Stripe webhook), action, target (provider/license/post), before → after diff, reason, timestamp, IP
- [ ] Filters: actor, action type, provider, date range; Export CSV; pagination
- [ ] Logged: approvals, rejections, change requests, suspensions, document views/downloads (PHI-adjacent), role changes, blog moderation, manual billing overrides

**Permissions**
- [ ] Roles: **Owner** (everything, including team, billing overrides, delete) vs **Staff/Reviewer** (queue, review, moderation; no team or delete). Hide or disable unauthorized actions with a reason tooltip; return 403 server-side.
- [ ] 2FA required for admin accounts; session timeout
- [ ] Admin routes are fully separate from provider routes; no admin UI is reachable from the provider nav

**Missing from Figma:** all of it. Nothing admin or back-office is designed.

---

## 10. Feature 7: Notification preferences and account settings (provider)

### References reviewed
- Notification toggles: Xero (grouped, plain-language "Email me when…") ([screen](https://mobbin.com/screens/60550fe8-e19b-443b-8a2f-1a2c5b796bbe)); GoFundMe (transactional vs marketing groups, **"Unsubscribe from all marketing emails"**) ([screen](https://mobbin.com/screens/db9d7d05-87da-42cf-bf39-ca46b22e7b23)); beehiiv (per-event toggles, **daily/monthly recap digests**, "Restore defaults") ([screen](https://mobbin.com/screens/754d8242-1817-438e-aa84-5abb45c499ba)); Cloudflare ("Member since…", Settings / Notifications tabs) ([screen](https://mobbin.com/screens/53c2d75e-a4f3-404d-860c-fa69cc6c2096)); Loops (enabled/disabled label next to the toggle) ([screen](https://mobbin.com/screens/e718bf09-2bbc-48f0-93b8-1acca5ddb83a))
- Account and security: Typeform (Change email / Change password, Enable 2FA, Danger zone linking to "cancel your subscription instead of deleting") ([screen](https://mobbin.com/screens/52cd51d9-798d-46b2-9403-13449595a8a8)); Webflow (account security activity: login/logout log; "contact support to delete") ([screen](https://mobbin.com/screens/9d68b778-0fb4-4dbd-8f4e-fb0eeb2805ba)); Pipedrive (password rules, **"Log me out on all other devices"**, success toast, 2FA options) ([screen](https://mobbin.com/screens/9a672e8d-ba5e-49ab-b7fc-cd8b836bf2cf)); Chatbase (Danger zone, irreversible warning) ([screen](https://mobbin.com/screens/22d98409-6111-44bc-af05-8df237cab0a8))

### Best-fit pattern for PsychMind
A Settings area with tabs **Account · Security · Notifications · Billing** (Billing from Feature 5).
- **Notifications:** GoFundMe-style. Required transactional emails are shown but locked (new session request, verification result, billing/dunning, license expiry, security). Optional emails are toggles (unactioned-request reminders, weekly performance digest, blog moderation outcomes, PsychMind news/tips).
- **Account deletion:** Typeform-style, routed through "cancel subscription first".

### Build checklist
- [ ] Account: legal name (read-only after verification; change via support or re-verification), display name, **login email change with verification of the new address** + notice to the old address, phone (optional)
- [ ] Security: change password (current + new + rules), log out of other sessions, 2FA (recommended for providers because the inbox holds patient contact info), recent login activity
- [ ] Notifications: grouped toggles; locked required items with an explanation; "Unsubscribe from all marketing"; digest frequency; **email unsubscribe links must deep-link here**; save feedback (instant toggle with toast, or Save button)
- [ ] Listing availability: voluntary "Pause my listing / not accepting new clients" (decide; different from a billing pause)
- [ ] Danger zone: delete account → requires canceling the subscription first; explain what is deleted (profile, blogs, requests) and what is retained (invoices, audit); confirm by typing; grace period?
- [ ] States: loading, save error, email-change pending verification banner, password-reset-required

**Missing from Figma:** the entire settings area (only auth / forgot-password screens exist).

---

## 11. Feature 8: Blog/article editor with draft, publish and moderation states

### References reviewed
- Post lists with status tabs: Wix **Published / Drafts / Pending Review / Scheduled / Trash** with counts + "Your post was saved as draft" toast ([screen](https://mobbin.com/screens/b4b4bd64-1898-471f-b97d-5be5e569bcbe)); Semrush Published / **Not approved** / Scheduled / Drafts / Errors ([screen](https://mobbin.com/screens/30d3b4f2-b68f-493c-9603-a19c20f2bd2c)); Circle All / Drafts / Scheduled + Status column + "Draft saved" toast ([screen](https://mobbin.com/screens/e6471326-4a9f-4c62-8dca-5c5962e69b0d)); Substack Published / Scheduled / Drafts + "Post deleted" toast ([screen](https://mobbin.com/screens/83bb6383-b847-43c8-b925-d59334e9f997)); Hashnode Published / Drafts / Scheduled / Deleted + slug column ([screen](https://mobbin.com/screens/c8d11f8d-cb39-4032-9f8f-8ece79935cc5)); Buffer Queue / Drafts / **Approvals** / Sent ([screen](https://mobbin.com/screens/5730b450-ae0f-42f7-88e4-86a0a33b0dc9))
- Editors: beehiiv (**"Draft · Synced"** pill, word count, undo/redo, version history, Preview, Post/SEO tabs) ([screen](https://mobbin.com/screens/95aeb6fb-5678-43eb-acde-e4c7599f4c65)); Hashnode ("Saved" indicator, SEO title/description, OG image with recommended size) ([screen](https://mobbin.com/screens/aa594e1e-fa0a-4ad5-af7a-fdc64d34a1f4)); Podia (Summary / Details / SEO tabs, publish date, post URL slug, Delete post) ([screen](https://mobbin.com/screens/a1ddc2d7-c601-4f6f-9629-45e0283b42d5)); Wix (Save / Preview / Publish, SEO side tool) ([screen](https://mobbin.com/screens/c473b3ca-7867-4cd8-9fbb-496e4bc3ed18)); Mintlify (page settings: slug, description, OG image, keywords, hidden toggle) ([screen](https://mobbin.com/screens/48ef44e7-76ea-48c8-b568-0983b51e956e))
- Moderation (admin side): Reddit Queue **Needs Review / Reported / Removed / Edited**, Approve / Remove, Mod Log, Saved Responses ([screen](https://mobbin.com/screens/c20fd251-fbfe-471b-b3a4-c0175cf1ada4)); Circle Moderation Inbox / Approved / Rejected with reasons ([screen](https://mobbin.com/screens/14890efa-be84-4cf5-8541-fee384c1b459)); Klaviyo reviews status filter Pending / Published / Featured / Rejected + "Reject review" menu ([screen](https://mobbin.com/screens/58831a24-17a8-4f7b-a044-596b0b954e38)); Assembly approvals inbox ([screen](https://mobbin.com/screens/f77c7f8c-610d-4a08-8264-9ea2aaaf5f3f))

### Best-fit pattern for PsychMind
Keep the Figma block editor and Publish settings card. Add a **Wix-style status model**:
- **Provider side:** Draft → *In review* (if moderation is on) → Published, with *Changes requested* and *Unpublished* states.
- **Admin side:** a **Reddit/Circle-style moderation queue** (Needs review / Published / Rejected) using the same reason-template system as verification.

Mental-health content published on PsychMind's Resource Center carries reputational and clinical-claims risk, so pre-publication review is recommended. This needs a client decision.

### Build checklist
**Provider list**
- [ ] Status tabs or a status column with counts: Drafts / In review / Published / Changes requested / Unpublished (the Figma list has no status)
- [ ] Empty state for no posts (the hero illustration exists; add a CTA and guidance on topics/guidelines) + empty per tab
- [ ] Row actions by status: Edit, Preview, View live (published), Unpublish, Delete (confirm; warn if published), Duplicate?
- [ ] Toasts: draft saved, submitted for review, published, deleted (with undo)

**Editor**
- [ ] Autosave indicator (Saving… / Saved / Offline, retry); unsaved-changes guard
- [ ] Preview as it will appear on the Resource Center (desktop/mobile)
- [ ] Publish settings additions: cover image (size guidance, crop), excerpt/summary, slug (auto + editable, uniqueness error), SEO title/description, tags/category (exists), reading time
- [ ] Primary CTA by state: "Submit for review" (moderated) vs "Publish now" (exists); "Save as a draft" (exists)
- [ ] Changes-requested state: moderator feedback banner at the top of the editor + resubmit
- [ ] Editing a published post: does it go back to review? Show the live version until the new one is approved.
- [ ] Validation: title required, minimum length, images require alt text, link checks; image upload errors (type/size)
- [ ] Content guidelines link / clinical-claims disclaimer acknowledgement (copy needs client approval)
- [ ] Author byline auto-links to the provider profile; behavior when the provider is paused, canceled or suspended (hide posts? keep with "author not currently listed"?) (decide)

**Admin moderation**
- [ ] Queue (Needs review / Published / Rejected / Reported?) with preview, Approve / Request changes / Reject + reason templates, audit-logged
- [ ] Unpublish a live post (with reason) and feature a post on the Resource Center (optional)

**Missing from Figma:** status model and tabs, autosave, preview, SEO/slug/cover/excerpt fields, submit-for-review, moderation feedback, unpublish, delete confirmation, empty/error states, the admin moderation queue.

---

## 12. Email touchpoints (no Mobbin coverage, but required by the flows above)

| Trigger | Recipient | Must link to |
|---|---|---|
| Account email verification | Provider | Verify → wizard |
| Onboarding abandoned (1/3/7 days) | Provider | Resume wizard |
| Submitted for verification | Provider | Pending dashboard |
| Changes requested (with reasons) | Provider | Wizard step needing a fix |
| Rejected (with reason) | Provider | Support |
| Approved, activate listing | Provider | Activate → Stripe Checkout |
| New session request | Provider | `/dashboard/requests/[id]` (auth redirect) |
| Request still "New" after N days | Provider | Request detail |
| Payment failed (profile pauses in 3 days) | Provider | Update payment / pay invoice |
| Profile paused (hidden) | Provider | Pay now |
| Payment recovered (live again) | Provider | Dashboard |
| Cancel confirmed / ends on date | Provider | Restore |
| License expiring (60/30/7 days) / expired | Provider | Credentials upload |
| Suspended / unsuspended | Provider | Support / dashboard |
| Blog: in review / changes requested / published / unpublished | Provider | Editor |
| Weekly performance digest (optional) | Provider | Analytics |
| New item in verification queue / SLA breach | Admin staff | Admin review page |
| Request status changed (contacted / not a fit) | Patient | Patient's request view |

---

## 13. Open business decisions to confirm with the client

1. When is the card collected: after approval (as the business rules say) or during onboarding (as the Figma plan modal implies)? What is the refund policy if rejected?
2. Rejection model: "changes requested" (fixable) vs "rejected" (final). Can a rejected provider re-apply, and after how long?
3. Which profile edits trigger re-verification after going live?
4. Hidden or paused profile: what does the direct URL show? What happens in patients' saved lists?
5. "Not a fit": is it reversible? Is there a patient-visible reason or referral? Is there an undo window?
6. Request data retention period. Can paused/canceled providers still access past requests?
7. Do provider blogs need admin approval before going live? What happens to blogs when a provider is paused, canceled or suspended?
8. A voluntary "not accepting new clients" toggle, separate from billing pause?
9. License expiry: auto-hide on the expiry date, or manual admin action? Is the profile hidden per state or entirely?
10. Admin roles: is owner vs staff enough? Do staff need a 2-person rule for rejections or suspensions?
11. Search-keyword analytics: minimum-count threshold before a keyword is shown (privacy).
12. Stripe Customer Portal (fast) vs custom billing page (branded, status-aware)?
