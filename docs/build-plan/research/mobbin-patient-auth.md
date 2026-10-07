# PsychMind: Mobbin gap analysis for patient-side and auth flows

**Purpose:** Before the Next.js build, check the Figma's patient-side and auth flows against best-in-class reference apps on Mobbin. List the states, steps and edge cases a designer may have missed.
**Date:** 2026-10-07
**Sources:** Mobbin MCP (`search_flows` / `search_screens`). I used platform `web` first and fell back to `ios` only where web results were thin: the mobile filter sheet, "no exact matches", the therapist profile, Zocdoc booking and crisis screens. I viewed every reference image before citing it.
**Figma inputs reviewed:** `figma/PROJECT_OVERVIEW.md`, `figma/screenshots/s3_auth.png`, `s3_search_left.png`, `s3_search_right.png`. I cropped and zoomed these screenshots, but they are low resolution. Small labels below are my best reading, so verify exact wording in Figma.

> **Content rule (client-approved copy):** The existing PsychMind copy is client-approved and must not be reworded. Microcopy below appears **only for new states that have no copy yet**. Treat it as a draft for client approval. Where existing copy looks inconsistent with the business rules, this report **flags it** and does not propose edits.

> **AI usage notice:** None of the Mobbin results returned an `ai_usage_notice` field, so there is nothing to reproduce here.

> **Coverage note:** Mobbin has little *web* coverage of Zocdoc, Headway, Alma, Talkspace, BetterHelp, Rula, Spring Health or One Medical. Zocdoc appears only on iOS. Headspace's care/therapy booking appears on web, and Alan's therapy flow appears on iOS. For marketplace patterns I used Airbnb, Care.com, Preply, Wix Marketplace, Airtasker, Turo and Zillow.

---

## 0. What the Figma already covers (observed)

| Area | Observed in Figma (desktop + phone frame) |
|---|---|
| Role selection | Step 1 of 2: "Who are you joining as?", with radio cards for client and provider, then Continue and an "Already have an account? Sign in" link. |
| Create account | First/last name, email, password and confirm password, then a primary CTA. Below that: "Or continue with" and **one** social button (looks like Google), plus terms text in the footer. |
| Log in | Email, password, a "Forgot your password?" link, Continue, "Or continue with" plus one social button, and a sign-up link. |
| Reset | Reset password (email), then Link sent (shows the email address, with a "Didn't get it? resend" style line), then Set a new password (two fields). |
| Search results | Search bar for format (In-person/Online), location, "What's on your mind?" and "Who feels right?". Left filter sidebar with "Clear all": session format, specialties with counts, "+N more", a "Search specialty" field, therapy approach chips, provider gender, language, age groups, a fee range slider and "Accepts insurance" with insurer names. Applied-filter chips row, a "132 providers found" count with a small icon on the right (possibly sort), and provider cards with See profile, Save, "Your info is never shared" and "Credentials manually verified". |
| Loading | Results skeleton with a "Searching our database..." label (good). |
| Empty | Illustration, a "couldn't find providers within the chosen filters" message, a Clear filters CTA, and a **"Recommended providers"** list below (good: this is the "close enough" hook). |
| Mobile filters | Full-screen "Search filters" sheet with format, where, what's on your mind and every filter group, plus Cancel / Save at the bottom. |
| Logged-in search | Header swaps "Log in / Create account" for a user menu. |
| Provider profile | Breadcrumb, cover image and photo, name, credentials, **Verified** badge, location chip, "Online & in-person". Sections: Who I work with, About (Read more), Specialties (issues / approaches), and Credentials & qualifications (license with "Verified by PsychMind", education, experience, languages, session types). Sticky right card: fees per session type, "Online & in-person available", **Request a session**, **Call provider**, Save profile, "Your info is never shared" and "Credentials manually verified". |
| Request flow | Confirm request, then Session details (Individual/Couples, Online/In-person), then "A note to [Name]" (optional, with Skip), then "Almost there" (Log in / Create a free account / **Continue as guest**), then contact details (name, phone, email), then Review your request, then **"You're all set"** in two variants. The guest variant offers "Create a free account"; the logged-in variant shows "Check all requests" and says the request was saved to "My requests". |
| My requests | List of requested providers, each with the submitted details (name, email, session type, format, note) and a **"Pending answer"** status. |
| Saved providers | Listed in the overview; I did not inspect it closely in the crops. |

---

## Top 15 missing states and steps (priority order)

1. **Crisis resources (988)** are absent from every in-app screen: search, profile, request note step, confirmation, error pages. The request "note" step is where a person in crisis may type, so it needs an inline crisis line.
2. **Email verification step** after sign-up (code and/or link, resend with cooldown, wrong or expired code). There is also no rule yet for guest requests, where an unverified email goes straight to a provider.
3. **Auth error states**: wrong credentials, too many attempts, email already registered, Google sign-in cancelled or failed, expired or used reset link, and password-updated success.
4. **Session expiry** modal or page that preserves the in-progress request draft and returns the user to it after re-login.
5. **Search error/retry state**. Only loading and empty are designed.
6. **Location input states**: autocomplete, "Use my current location", permission prompt, denied or unavailable, unknown or non-US place, and the online-but-licensed-in-your-state rule.
7. **Sort control + pagination or "Show more"** behaviour, including the URL-synced filter state and restoring scroll position on Back.
8. **Mobile filter sheet live count** ("Show N providers") and per-group selected counts. Today the sheet ends in a plain Save.
9. **No-results relaxation UX**: per-filter "remove X (+N providers)" suggestions, a label on each close-enough card saying *which* criteria it misses, and a separate state for when nothing exists nearby at all.
10. **Profile states**: not accepting new clients, already requested (CTA changes), provider removed or deactivated (404 variant), what "Verified" means (a popover), license state(s) for online care, a mobile sticky CTA bar, and Share / Report.
11. **Request form validation, failure and duplicate-request states**: field errors, a submit spinner, network failure with data kept, an existing pending request with this provider, and a provider who becomes unavailable mid-flow.
12. **"Who is this for?"** (me / my child or teen / partner) plus preferred days and times. This is needed because providers filter by age group served and there is no scheduling.
13. **Request status model + detail page with timeline**: Sent → Accepted/Contacted → Declined / No response (expired) / Withdrawn. Also needed: a "Withdraw request" action with confirmation and a "Haven't heard back?" nudge.
14. **Empty states** for My requests and Saved, plus guest requests being claimed into a new account.
15. **Account settings, all of it**: profile, change email (verify the new address), change or set password, notification preferences, unsubscribe landing, download my data, and delete account with honest consequences. Plus global 404/500/offline pages and toast patterns (save/unsave with Undo).

---

## 1. Sign up / log in / email verification / password reset / session expiry / social login

### References reviewed
- **Email verification flows:** [Jira onboarding (email, then verify, then "Email address verified", then finish profile)](https://mobbin.com/flows/a9262dda-0fb7-4350-ac55-a9b8b1a5b29c) · [Perplexity onboarding, "Check your email" with code entry and a loading button](https://mobbin.com/flows/4f0420a7-42f1-4e16-b3a9-fd3f4d5da072) · [Perplexity onboarding (variant)](https://mobbin.com/flows/a461b379-bead-4ecb-8ea9-df84aef3ccb9) · [Exa, "Verify your email" with *Resend verification email* and *Use another account*](https://mobbin.com/flows/f5a66043-fd06-45c8-b374-98ab531fd33f) · [Variant, code field with a 60s resend countdown](https://mobbin.com/flows/a3b82ebd-674a-4725-9d77-91fda49ab2e5) · [Time2book, segmented 6-char code, "check spam too", "Click the link or use the code", Resend](https://mobbin.com/flows/5f14923b-cc8b-450c-bbde-9cda9b0f6dde) · [User Interviews, two-step code plus a "You have been signed in" toast](https://mobbin.com/flows/0556376e-a619-44f4-99aa-ee29cf5b2723)
- **Health sign-up (social login decision):** [Hers, create-account side drawer with email/password, Google and Apple, and consent text](https://mobbin.com/flows/5ad8f8ea-7b90-4460-8a92-c23e75c9ba9b) · [Hims (same pattern)](https://mobbin.com/flows/789b6d5f-1935-4a86-9f75-33edbdddc314)
- **Login errors:** [Cloudflare, error under the button](https://mobbin.com/screens/b9278f30-6fbc-443f-8379-6bfd0012dc9a) · [Tana, "Invalid email or password" banner](https://mobbin.com/screens/b27499c8-03d4-4894-a25d-4d7f5c6630b6) · [WorkOS, banner plus an email sign-in code fallback](https://mobbin.com/screens/812592ce-380a-4998-a10e-55ac97d12858) · [Mixpanel, field-level "Password is required"](https://mobbin.com/screens/79327bd4-3be5-4209-993f-e21516c111b5) · [Dribbble, plain-language error plus a "send me a code" fallback](https://mobbin.com/screens/5ec0fd4e-75dd-40e0-a884-ab4299458f76) · [Basecamp, "We didn't recognize that password" with an inline Forgot link](https://mobbin.com/screens/fc4b09cc-c993-4de6-9504-a641640313bc)
- **Password rules:** [Uxcel, live checklist](https://mobbin.com/screens/69e77196-7b4d-4a0b-b499-564b5eb5fd3f) · [Relevance AI, ✓/✗ rules](https://mobbin.com/screens/c07ee9fc-5d66-431d-8831-aff26f62dcbb) · [Dovetail](https://mobbin.com/screens/7a697042-a33a-463d-b824-569361bc3ef5) · [Wise, rules in an error tint](https://mobbin.com/screens/ba203514-7deb-4ff6-89eb-c11eca2b1860)
- **Expired/invalid reset link:** [NordVPN, "This link has expired"](https://mobbin.com/screens/dfa9ee24-160c-445b-b605-623b2f588d2b) · [Podia, reset form re-shown with a "link has expired" banner (best)](https://mobbin.com/screens/200cca5a-3725-4ad6-93bd-b69d82be9f5b) · [Sentry](https://mobbin.com/screens/0dbee83b-078f-4234-ac44-939735152a23) · [Jitter, "invalid or has been used already"](https://mobbin.com/screens/afbfda33-219a-4d01-b1cd-d25b1289c6ca) · [The Leap, "Link expired? Get a new one here" on the set-password form](https://mobbin.com/screens/ac7aacdb-5c14-48c4-a6b1-cbc661d554e9)
- **Session expiry / logout:** [Rocket Money, gentle modal over blurred content: "we've logged you out to keep your information safe"](https://mobbin.com/screens/0727897f-0c0a-464c-844e-dd987cb1e671) · [Employment Hero, "Hi Jane, are you still there?" re-auth in place with a countdown](https://mobbin.com/screens/80a62519-da66-4bc6-b988-92bbf392b408) · [Revolut](https://mobbin.com/screens/faab0919-54b5-4d86-8449-ba5166cbacaf) · [Melio](https://mobbin.com/screens/13f6a790-96f6-4235-b115-fe403d7b0d53) · [Cal.com, "You've been logged out" confirmation](https://mobbin.com/screens/a8397696-691d-4dcb-9268-8606cb32cce4)

### Pattern that works best for PsychMind
- **Keep the Figma's email + password** and add **a 6-digit code *and* a magic link in the same email**, as Time2book does. People on phones often open the email in a different browser, and the code still works across devices.
- **When to verify:** let new clients browse and save right after sign-up, but **require a verified email before a session request is sent**, whether guest or account. The provider receives the patient's contact details by email, so an unverified or mistyped address means a lost lead and opens a spam/abuse vector.
- **Social login decision:** ship **Google only** (the Figma already shows one social button) and defer Apple. Apple's "Hide my email" relay addresses can confuse providers who reply by email. Two things must be handled: (a) a Google account whose email already exists as a password account (link after a password check, or after verifying via Google), and (b) a Google-only user later choosing "Forgot password", which should offer "Set a password" instead.
- **Privacy-safe errors:** log-in shows a generic "email or password is incorrect" banner (Tana/WorkOS). Forgot password always shows the same "If an account exists, we've sent a link" result, so nobody can probe whether a person has an account on a mental-health site. This matters more here than in most products.
- **Session expiry:** use a Rocket Money-style gentle modal. It explains why ("to keep your information safe"), re-auth returns the user to the same URL, and any **request draft is preserved**.

### Build checklist
- [ ] Role-selection step remembers the chosen role through Google OAuth. A provider must not land in the client flow, and vice versa.
- [ ] Create account: field-level errors for required fields, invalid email, password rules (live checklist), confirm mismatch, and **email already registered**. That last one is phrased neutrally, offers Log in / Reset password, and ideally also sends an email to the existing address.
- [ ] Show/hide password toggle. Correct `autocomplete` attributes (`email`, `new-password`, `current-password`, `one-time-code`) so password managers and SMS/email code autofill work.
- [ ] Age/eligibility attestation (18+ account holder). Providers serve children and teens, so a parent or guardian creates the account (see §5 "Who is this for").
- [ ] Submit buttons: loading spinner, disabled while pending, double-submit protection.
- [ ] **Verify email screen**: masked address, code input (paste-friendly, auto-submit on 6 digits), "Check spam", Resend with a 30–60 s cooldown, "Use a different email", wrong-code and expired-code errors, a verified success state, and a redirect back to the original intent (for example, step 5 of the request flow).
- [ ] Unverified-account banner on My requests / Saved, with Resend.
- [ ] Log in: generic error banner, **too many attempts / temporarily locked** state, unverified account (resend verification), "This account uses Google, continue with Google" hint, `?next=` redirect back, and an already-logged-in visitor to /login redirected away.
- [ ] Google OAuth: popup blocked, user cancelled, and provider error states, each with a retry.
- [ ] Forgot password: identical response for known and unknown emails, Resend with cooldown, and "Wrong email? Go back".
- [ ] **Reset link expired/used**: re-show the reset form with an error banner (Podia).
- [ ] Set new password: rules checklist, mismatch error, then a **success** state ("Password updated", auto sign-in or go to log in), and invalidate other sessions.
- [ ] **Session expired** modal or page with intent and draft preservation.
- [ ] **Logged-out** confirmation (Cal.com).
- [ ] Optional: "Remember me / stay signed in" on shared computers. This is a privacy consideration for mental-health users, so default it to off.
- [ ] Crisis line in the auth layout footer (small, persistent).

### Flags vs. Figma
- MISSING: verify email screen and its error/resend states; every auth error state; session-expired; logged-out page; expired/invalid reset link; password-updated success; rate-limit state; post-sign-up landing (where does a new client go?).
- DECISION: Google-only vs. Google + Apple, and the account-linking rules.

---

## 2. Search results with filter panel

### References reviewed
- **Professional directory search:** [Polywork, "Discover Professionals" (dropdown filter pills, Reset, result-count headline)](https://mobbin.com/flows/e634004c-cf78-4af7-8b81-79a5beefa7db) · [Polywork, filter dropdown with search and "Reset filters"](https://mobbin.com/screens/16e42ada-3c4d-44b2-bbcc-243323cd545b) · [Preply, tutor search (filter pills with counts such as "Specialties 3", "Sort by: Our top picks", "Search by name or keyword", Save)](https://mobbin.com/screens/62097ab7-2490-4a1d-93c4-cc384ffcceb1) · [Care.com, caregiver search ("Filters (3)" plus Clear all, a "Recommended" sort dropdown, **Save search**, Contact CTA, heart)](https://mobbin.com/screens/45dd673c-8a9f-4874-bda2-85f98b5a229b) · [Care.com search flow](https://mobbin.com/flows/324ee61f-3636-470e-98f4-341dc6dd0455) · [Semrush, "1553 agencies" count plus a "Sort by" select](https://mobbin.com/screens/b485a30e-88b2-4a5c-8a54-e97bb6dcf34f) · [Airtasker, "Loading results..." then **Load more results**, plus a "Can't find what you need?" CTA](https://mobbin.com/flows/45b67207-38cf-4995-8320-6adf804a27fa)
- **Location / map:** [Fresha, location autocomplete with match highlighting, then list + map split](https://mobbin.com/flows/75edeab2-9db4-4f5c-8c56-8e983f11ad68) · [Fresha autocomplete](https://mobbin.com/screens/07f1acb1-7f36-499f-8411-8c9a2f31bb3d) · [Turo, "Current location" plus history in the Where dropdown and a Grid/Map toggle](https://mobbin.com/screens/e66c94f2-e07e-4614-ab0d-04364953f510) · [Zillow, Current Location plus search history, and Save search](https://mobbin.com/screens/c429086a-9480-4e1f-b845-e5427aed9ba3) · [Walmart, "Use my current location" link under the ZIP field](https://mobbin.com/screens/0cf8bcfa-17ad-45e3-bb59-b6d1e9d42309) · [sweetgreen, pre-search state: "Enter an address... Enable location services"](https://mobbin.com/screens/8b66fcb1-8448-421e-95bb-9c4e1d3ab168) · [Square, "Please select an address from the suggestions list"](https://mobbin.com/screens/93ba7bf7-faa4-4c51-878d-3a15cbea5c64) · [Airbnb, results count plus list/map](https://mobbin.com/screens/c91c2a78-6594-4778-93da-b02cc994f014) · [Eventbrite, list + map with "Search this area"](https://mobbin.com/screens/30c7272a-cd44-4de6-b152-7170b8e7f7fd)
- **Mobile filter sheet (iOS):** [TheFork, "SEE 6 RESULTS" plus per-section selected counts and Reset](https://mobbin.com/screens/83b46d83-8748-4f06-a94f-0d1b03f37b4f) · [Booking.com, "Show 70 results" plus Reset all](https://mobbin.com/screens/f9dbdc2a-32c9-4d21-ac20-b8e98b529aac) · [Rakuten, "13,929 products" header, "Apply 3 Filters", Clear Filters, See more](https://mobbin.com/screens/61c99e32-fa05-4eba-b6ac-999b66861f1a) · [UNIQLO, accordion groups with a live "12 item(s)" count next to APPLY](https://mobbin.com/screens/4e8756e6-a0c7-4a5a-aa3a-2c1bf68bf5e9) · [Agoda, Clear / Filter split footer, See more](https://mobbin.com/screens/8bdcde8c-ef77-4c3d-ba5f-e44c2b40c901) · [foodpanda, Sort placed inside the filter sheet](https://mobbin.com/screens/750c59e6-ca1b-4304-be52-1b370f56a86e)
- **Error inside results:** [Care.com, "Something went wrong" plus **Retry** in the results column, with filters still usable](https://mobbin.com/screens/859e00b8-b2c4-47cb-bc19-61bf0c536c91)

### Pattern that works best for PsychMind
- **Desktop:** keep the Figma's left sidebar plus applied-chip row plus count. Add a clear **Sort** dropdown next to the count: Best match (default) · Lowest fee · Nearest (only when in-person and a location is set). A small "How we sort" info popover helps trust in a health context.
- **Mobile:** keep the full-screen sheet. Swap the footer to **Clear all / Show N providers** with a live count (TheFork, Booking.com), and show selected-count badges per group header ("Specialties · 2"). Put Sort at the top of the sheet (foodpanda) or as its own small sheet.
- **Pagination:** use **numbered pages or a "Show more providers" button, not infinite scroll** (Airtasker). The page has the "Ready to find help?" band and a footer that must stay reachable. Directory pages benefit from crawlable `?page=` URLs, and Back from a profile must land at the same spot. Show "Showing 1–20 of 132".
- **Filters live in the URL** (`/search?loc=33130&specialty=trauma&page=2`). That makes them shareable, keeps them across Back/refresh, and lets the server render them. **Never put free-text "What's on your mind?" in the URL** if users may type sensitive content. Keep it in the session/POST, or map it to a specialty slug.
- **Location:** use a US city/ZIP autocomplete (Fresha) with **"Use my current location"** as the first row (Turo, Walmart). Store the *state*, because **online therapy still requires the provider to be licensed in the client's state**. Choosing "Online" therefore changes the meaning of location, not whether it is needed.
- **Map vs list:** ship **list-only** in v1, with a distance or "Online only" label on each card. A map toggle can come later. Show approximate pins for providers whose office is in their home.

### Build checklist
- [ ] **Pre-search state** (no location yet): prompt plus "Use my current location" (sweetgreen).
- [ ] Location autocomplete: typing, loading, results with match highlighting, keyboard navigation, **no match**, **non-US place**, free text not picked from the list (Square-style error), and clear (×).
- [ ] Geolocation: prompt, **granted** (reverse-geocode to city or ZIP), **denied** (inline "Location is off. Type a city or ZIP instead"), timeout, unavailable.
- [ ] Results loading: skeleton on first load ✓. On filter change, keep the current results dimmed with a small progress indicator so the page doesn't flash.
- [ ] **Error state** in the results column with Retry, keeping filters usable (Care.com).
- [ ] Result count with singular/plural, plus "Showing X–Y of N".
- [ ] Applied chips: each removable, "Clear all", horizontal scroll or "+N" overflow on mobile, and chips for the fee range and format too.
- [ ] Filter groups: "+N more" expand/collapse ✓, specialty search ✓, plus a **"No specialties match 'xyz'"** state inside the filter and zero-count options shown disabled rather than hidden.
- [ ] Fee slider: keyboard-accessible handles, numeric inputs synced, min ≤ max validation, and a "Sliding scale available" option if the business supports it.
- [ ] Sort dropdown: the selected value persists in the URL.
- [ ] Pagination or "Show more": loading on the button, last page, scroll to the top of the results on page change, and Back from a profile restores the page and scroll position.
- [ ] **Save (heart) on a card while logged out**: auth modal, then **the save completes after login** with a toast (intent preservation). Logged in: optimistic toggle, a toast with Undo, and revert on error.
- [ ] Mobile sheet: Cancel with unapplied changes discards them (or confirms), a live count that shows **0** with a hint ("Try removing a filter") instead of an empty jump, and focus trap plus Esc for a11y.
- [ ] Card variants: no photo (initials avatar), long name or credentials (truncate), more than 4 specialties ("+N"), online-only (no address), fee range ("$90–$150"), **not accepting new clients** (excluded by default, or labelled).
- [ ] Small persistent crisis line on the results page (see §8, cross-cutting).

### Flags vs. Figma
- MISSING: sort states, error/retry, pre-search state, location autocomplete and permission states, pagination or "Show more", the logged-out save prompt, a live count in the mobile sheet, and the filter-change loading state.
- CONTENT FLAG: an **"Accepts insurance"** filter with insurer names is designed, but insurance is still TBD. Hide it behind a feature flag until a decision is made. Do not reword.
- CONTENT FLAG: cards say **"Your info is never shared"**, but the request flow *does* send the patient's name, phone and email to the chosen provider. The claim is presumably meant as "never shared with anyone else", but taken literally it contradicts the request flow. The client should confirm the intent and wording; legal/trust review recommended.
- DECISION: is "Who feels right?" (gender, language and so on) a filter or a preference? The Figma shows it in both the search bar and the sidebar, so they must stay in sync.

---

## 3. No-results and "similar results"

### References reviewed
[Pinterest, "Tweak your search" with **per-filter remove buttons** ("Remove price", "Remove brands", ...) plus Clear all filters](https://mobbin.com/screens/45560b08-b73e-4f7e-8a82-878c035ddd68) · [Preply, "Looks like we can't find any matches", listing every applied filter grouped as removable chips](https://mobbin.com/screens/a025b278-1701-490c-aa9e-737121f2e033) · [Navan, "0 of 1027 results" (shows that matches exist without filters) plus Reset Filters](https://mobbin.com/screens/6bc2afe2-79b4-4db9-b1b9-3af07bee20fc) · [OpenSea, applied chips stay visible above "No results found" plus Clear filters](https://mobbin.com/screens/45a834a8-d95b-43fe-8420-7f0660bb528b) · [Codecademy, "Try adjusting your filters or check out one of these popular events" plus Reset](https://mobbin.com/screens/98950d41-eb89-49b7-8dc7-0b9bb585e3a0) · [Uxcel, popular-search chips](https://mobbin.com/screens/e7ae3281-0fdc-4936-98e2-16ccb49d2df9) · [Thrive Market (iOS), "No Results" with **"Recommended For You"** below](https://mobbin.com/screens/3e1f6d8b-6214-4eaf-9610-74802b1d606c) · [Artsy (iOS), "0 Artworks" plus Clear filters](https://mobbin.com/screens/b99fed14-6416-43fb-a14f-fb69f1add1c8)

### Pattern that works best for PsychMind
The Figma already uses the Thrive Market pattern: an empty message, Clear filters, then "Recommended providers". Upgrade it with the **Pinterest + Navan hybrid**:
1. **Say what happened:** "No providers match all 6 of your filters." Keep the chips visible above the message (OpenSea).
2. **One-tap relaxations with counts**, computed server-side: "Remove *Provider gender: Female* (+12)", "Include online sessions (+30)", "Widen to 25 miles (+8)". Show the 2–3 highest-yield options first. This is gentler than a blunt "Clear filters" that throws away everything the person carefully chose.
3. **The close-enough list must be honest.** Put a "Close match" label on each card plus a short line saying *what's different* ("Doesn't list EMDR · Speaks English"). In a therapy context, hiding the mismatch erodes trust.
4. **Separate states:**
   - **Few results (1–3)**: exact results first, then a divider, "More providers you might consider", then relaxed results.
   - **Zero exact, some close**: the current Figma state plus the relaxation chips.
   - **Zero exact, zero close** (no providers in the area at all): offer to search online providers licensed in your state, try a nearby city, or save the search / notify me. This state must include the crisis line.

### Build checklist
- [ ] **Relaxation order rule.** This is a business decision and must be defined. Suggested: never relax *state licensure*; relax filters in this order: approach, then gender, then age group, then language, then fee, then format, then distance.
- [ ] Relaxation chips: each shows the count it would add, and applying one updates the URL plus the chips.
- [ ] "Close match" label plus a mismatch line on each recommended card. The same card component gets a variant.
- [ ] Few-results divider state.
- [ ] Zero/zero state with online-in-state and nearby-city fallbacks.
- [ ] Never show providers who are not accepting new clients in close matches.
- [ ] Analytics event on zero-result searches (which filters), to inform recruiting.
- [ ] Mobile: relaxation chips wrap. The recommended list is not hidden below a giant illustration, so keep the illustration small on phones.

### Flags vs. Figma
- PARTIAL: the empty state plus "Recommended providers" exists, but it has no per-filter relaxation, no "why this is recommended" label, no few-results divider state and no zero/zero state.

---

## 4. Provider profile page

### References reviewed
[Preply, tutor profile (sticky right card with price, stats, Book CTA, **Saved**, **Share**, *"Usually responds in 4 hrs"*, and a verified credential with *"Learn more"*)](https://mobbin.com/screens/28954c6b-49e0-4a22-bf18-bccafd84bedc) · [Headspace care, therapist card (In-network ✓, degree, specialties, language, "Approach to care", "More about me")](https://mobbin.com/screens/6d26d0ea-2cf7-4bf0-b1cf-51e45442bd08) · [Alan (iOS), therapist profile with next availability, languages, an **inline "Help is available... Get help" crisis card**, "From €70 per session" and a sticky CTA](https://mobbin.com/screens/ed903d4c-3065-4f73-a2f4-f7c6852d3736) · [Zocdoc (iOS), In-network badge, "+53 other locations", "No available appointments"](https://mobbin.com/screens/870e4d6e-5c61-4824-a13d-587fdb2cdad4) · [Airbnb, service profile with a qualifications list and a **sticky bottom "From $31 · Reserve" bar**](https://mobbin.com/screens/a3b51edb-e3b8-4e1d-bf88-ce2d79b28a64) · [Fiverr (iOS), avg. response time, member since, last active, languages](https://mobbin.com/screens/5f8032ef-ce47-477b-99da-1c64e87b328f)

### Pattern that works best for PsychMind
The Figma profile is already strong. Add these trust and decision helpers:
- **What "Verified" means**: a popover or link from the badge (Preply's "Learn more"). For example: "We checked this license with the [State] board on [date]." Show **licensed state(s)**, because that decides eligibility for online care.
- **Availability signal** without scheduling: "Accepting new clients" / "Waitlist" / "Not accepting", plus **typical response time** ("Usually responds within 2 business days") once there is data (Preply, Fiverr).
- **Fee clarity**: per session type ✓, plus session length, sliding scale, and whether a free intro call is offered (if the business supports these). Insurance stays hidden until decided.
- **Mobile sticky CTA bar** (Airbnb, Alan): fee "from $X" plus *Request a session*, always visible.
- **Inline crisis card** placed near the CTA or bio (Alan).
- **Similar providers** at the bottom, for when this one isn't a fit or isn't accepting.

### Build checklist
- [ ] Loading skeleton that mirrors the layout: left column text plus right card (Fabric/Frame, §8).
- [ ] **Not accepting new clients**: CTA disabled or replaced with "See similar providers", plus Save still available.
- [ ] **Already requested** (logged in): CTA becomes "Request sent · View status", linking to the request detail. Block duplicate pending requests.
- [ ] Saved state on "Save profile" (filled heart, toast with Undo). Logged out: auth modal, then complete the save.
- [ ] **Provider not found / deactivated**: profile-specific 404 ("This provider is no longer listed") plus similar providers, *not* a generic 404.
- [ ] Badge popover; license number plus state(s) plus verified date; a different visual state if verification expired or is pending (should never be shown publicly, so filter server-side).
- [ ] Missing data fallbacks: no photo, no cover, no education, no "Who I work with", single session type (hide the couples fee row).
- [ ] In-person address: show city/neighbourhood plus approximate area. Decide whether the full address is shown only after the provider accepts (provider privacy).
- [ ] **Call provider**: on desktop, show the number (a `tel:` link doesn't help there); on mobile, use `tel:`. Track the click. If a provider hides their phone, hide the button.
- [ ] Share (copy link / native share) plus **Report this profile** (inaccurate info, safety concern).
- [ ] Breadcrumb "Back to results" keeps the query (✓ breadcrumb exists; make sure it carries the URL state).
- [ ] SEO metadata plus JSON-LD (Physician/MedicalBusiness or Person) for public profiles.

### Flags vs. Figma
- MISSING: not-accepting, already-requested, deactivated/404, badge explanation, licensed states, response-time signal, mobile sticky CTA bar, Share/Report, similar providers, crisis card, profile skeleton.
- CONTENT/DECISION FLAG: **"Call provider"** is in the sidebar. There is no in-app messaging (✓ consistent), but the team needs to confirm the provider phone number is public. If it is, people may call instead of requesting, which affects "My requests" tracking.

---

## 5. Booking/request form for a professional

### References reviewed
- **Health booking (iOS, Zocdoc):** [Booking an appointment (new-patient checkbox, In person / Video visit, "Secure Booking" lock, **Patient: me / Someone else**, inline "A valid address is required to book with this doctor", phone "where the doctor can contact you", notes (optional), certify checkbox, "Appointment booked" plus **Add to calendar** / **Prepare for appointment**)](https://mobbin.com/flows/fcd6461e-af19-4ca9-9864-8b21c286888c) · [Making a doctor appointment](https://mobbin.com/flows/26c741b6-0231-4040-b5e9-890f0b6db100) · [Booking from Appointments ("No available appointments" days)](https://mobbin.com/flows/229b867a-fa73-45d2-b632-3a11fcf3254b)
- **Therapy booking (web, Headspace care):** [Emergency contact step, "This person will only be contacted in an emergency situation"](https://mobbin.com/screens/064feae4-ccbf-43ee-8c70-51e094ffc140)
- **Marketplace inquiry (web):** [Wix Marketplace, "Request a professional" (How-it-works side panel, contact info with **preferred communication language**, phone optional, consent: "Wix may share your information to enable professionals to contact you", success "Your project request was sent to 3 professionals... They'll reach out soon" plus **"Send your project details to more professionals"**)](https://mobbin.com/flows/03a9176f-7033-444c-a20a-b35e7703f0e9) · [Jobber client request (preferred days, **preferred times Any/Morning/Afternoon/Evening**, optional labels, then a "Request submitted. We'll be in touch soon." toast and a request detail page)](https://mobbin.com/flows/13bc2f40-c708-4405-89a3-3a6e72376e07) · [Pipedrive form (hint: "Never share sensitive information... through this form", then "Your message is sent")](https://mobbin.com/flows/c77f9668-552e-4da7-88a7-c7f2c10332ed) · [Bonsai brief, then "Thank you"](https://mobbin.com/flows/f8debf27-9d72-48fd-a773-aa4b1b6d9807)
- **Validation:** [Mercury, "Phone number is too short"](https://mobbin.com/screens/ed547eec-2691-473e-9844-ed3dfe315326) · [Instacart, "Please enter a valid phone number"](https://mobbin.com/screens/24781133-7edf-4862-8011-b3c5aae99b58) · [Melio, top error toast plus required-field legend](https://mobbin.com/screens/53833667-52e8-4157-a84a-963ddce9feed) · [Claude/Stripe, red field plus message](https://mobbin.com/screens/6e3d049f-83d9-4d35-912e-3763c1030a49)

### Pattern that works best for PsychMind
Keep the Figma's calm, one-question-per-step wizard: Confirm, Session details, Note, Almost there, Contact, Review, Done. Add these:
1. **"Who is this session for?"**: Me / My child or teen / My partner and me (Zocdoc "Someone else"). For a minor, collect the child's age range and the guardian's contact details, and validate against the provider's *age groups served*. Couples should line up with the "Couples" session type.
2. **Preferred days and times** (Jobber chips: weekdays/weekends × morning/afternoon/evening). There is no calendar, so this is the most useful extra signal for the provider.
3. **Preferred contact method** (email / phone / either) plus "OK to leave a voicemail?". That is a real privacy need for people whose household doesn't know they're seeking therapy.
4. **Note step**: helper text recommending they *not* include sensitive details (Pipedrive), a character counter, and an **inline crisis line**: "If you're in crisis, don't wait for a reply. Call or text 988." This is the most important missing safety element.
5. **Consent line** on Review stating what is sent to the provider and how (Wix). It has to agree with the "Your info is never shared" claim (see §2 flag).
6. **Success**: the Figma's two variants ✓. Optionally add Wix's "Request other providers too" (people who request 2–3 providers get seen sooner), presented gently and only after the main confirmation.

### Build checklist
- [ ] Step validation: inline errors under fields (Mercury/Instacart wording style), focus the first error, and an error summary for screen readers. Keep Continue enabled and show errors on click (more accessible than a silently disabled button).
- [ ] Phone: US format mask, optional vs. required must be decided, and "too short" / "invalid" errors.
- [ ] Email typo protection: "Did you mean gmail.com?" plus an edit link on Review (Review shows contact info ✓).
- [ ] Options reflect the provider: hide Couples if not offered, hide In-person if online-only, preselect when only one option exists.
- [ ] Back navigation keeps entered data. **Draft persistence** (sessionStorage) across refresh, session expiry and the login detour.
- [ ] **"Log in" from step 4** returns to the contact step with the account pre-filled. **"Create account"** goes to verify email and then returns to Review.
- [ ] **Guest path**: verify the email (code) before sending. This is the decision in §1.
- [ ] **Duplicate guard**: a pending request with this provider already exists, so show "You already sent [Name] a request on [date]" and link to it.
- [ ] **Provider became unavailable mid-flow** (stopped accepting or was deactivated): an error page with similar providers.
- [ ] Submit: spinner, double-submit protection. **Network/server failure**: inline error with Retry, data kept.
- [ ] Rate limit (requests per day per account/IP) with a friendly message.
- [ ] Success: the guest variant ✓ and logged-in variant ✓. A confirmation email to the patient (template to design). Optional "Add a reminder to follow up" (.ics).
- [ ] Step counter consistency ("Step X of Y") when the guest path adds steps compared to the logged-in path.
- [ ] Exit mid-flow: "Leave this request? Your details won't be sent" confirmation.

### Flags vs. Figma
- MISSING: who-it's-for, preferred times, contact preference/voicemail, note-step crisis line and privacy hint, consent line, all validation/failure/duplicate/unavailable states, exit confirmation, email verification for guests.
- BUSINESS-RULE FLAG: the brief says *"patients have accounts"*, but Figma step 4 offers **"Continue as guest"**. Decide whether guests are allowed. If they are, guest requests need a "claim on sign-up" path (§6) and email verification.
- CONTENT FLAG: the confirmation copy sets a response expectation ("most providers respond within 2–3 business days" or similar, from my reading of the low-res crop). The status model needs a matching **"No response yet / expired"** rule (§6).

---

## 6. Patient dashboard: my requests (status timeline), saved items, empty states

### References reviewed
- **Lists with status:** [Mercor, tabs with counts (Applications 3 · Saved 2), "Submitted" chips, "3 of 5 steps completed"](https://mobbin.com/screens/1ac1f719-f20f-4666-9a42-d32cf7013008) · [Klook, bookings with colored status text ("Booking confirmed" / "Awaiting payment") plus per-item actions](https://mobbin.com/screens/78e82cdd-3669-4f2e-b1a9-7709d7e870a7) · [Braintrust, "Pending" badges plus a status filter](https://mobbin.com/screens/c1a094dc-669d-4811-971b-efced426b82a) · [Airwallex, summary cards plus a status filter](https://mobbin.com/screens/64cb7251-edd5-4bfa-ad69-8f89182ffafa) · [Calendly, Created / **Expired** badges](https://mobbin.com/screens/bcf9d219-b0d5-4795-9d15-bdd0c1d84f0d) · [Jobber, request detail ("Requested on...", submitted answers)](https://mobbin.com/screens/101f5a3a-27a0-48d4-9b2f-28dfa523352d)
- **Status timeline:** [Hers, vertical timeline with **expected duration per step ("avg 12 hrs")** and "You'll be notified via SMS, email"](https://mobbin.com/screens/86231ec9-1c2b-4255-bfe0-8f30a3c32e4d) · [Contra, "Awaiting Sam's signature" banner plus a next-action button plus a checklist plus an activity log](https://mobbin.com/screens/1968548c-f02b-4b16-a755-fb57a5a9ba09) · [PlanetScale, request activity timeline plus a toast](https://mobbin.com/screens/78880fb1-c0dc-4307-a635-1fb9a0c5527e) · [incident.io, status stepper](https://mobbin.com/screens/0b441174-3405-416f-a142-dfbb383d21f9)
- **Withdraw/cancel:** [Turo, "Tell us why" reasons including **"I'm uncomfortable with my host"**, then Keep trip / Continue](https://mobbin.com/screens/e345fdad-20ea-44f4-994f-5ac404565b91) · [Klook, simple confirm with Go back / Confirm](https://mobbin.com/screens/1c508625-dd68-411a-a17f-20d5f4358a46) · [Navan, cancel with a required reason](https://mobbin.com/screens/c93317d7-2b59-4592-8573-ce3b14ba1636) · [Wix, cancel with "Send cancellation email" plus an optional message](https://mobbin.com/screens/573b4e95-dea1-46cd-9678-ccd458925f0f)
- **Saved empty states:** [GetYourGuide, "Save activities to your wishlist by clicking on the heart icon" plus a CTA](https://mobbin.com/screens/e31b236f-f666-4422-be9b-4af520cacd67) · [DoorDash, empty state that lists the benefits of saving](https://mobbin.com/screens/3fcbab73-0ba8-4cd2-8cb2-ad0cfc976517) · [Klarna, "Nothing saved" plus Find products](https://mobbin.com/screens/d5faa55c-399a-4279-b11b-f798d2f988ea) · [Mindtrip, tabs with counts plus an empty tab](https://mobbin.com/screens/38d277c5-e8d8-4235-8bcb-d00432580012)

### Pattern that works best for PsychMind
- **My requests list** (Figma ✓ with "Pending answer") plus tabs **Active · Past** with counts (Mercor), and the status in a pill *with text*, not color alone.
- **Status model**, which needs a business decision because there's no messaging:
  `Sent` → (`Viewed`, optional, only if the provider dashboard records it) → `Provider will contact you` (provider marked accepted/contacted) / `Not available` (provider declined) / `No response yet` (after N business days, auto-flagged) / `Withdrawn` (by patient) / `Closed` (auto after M days).
  This implies **the provider dashboard needs Accept / Decline / Mark contacted actions**. Check this against the provider-side research.
- **Request detail page** with a Hers-style vertical timeline: Sent (date) → Provider reviewing (typically 2–3 business days) → Provider contacts you by email/phone. A "What happens next" box and a summary of what you sent ✓ (shown in list cards today).
- **"Haven't heard back?" nudge** on stale requests: show similar providers and "Request another provider". Gentle, and no blame.
- **Withdraw request** with a short optional reason list (Turo). Include **"I felt uncomfortable"**, which offers a "Report a concern" path.
- **Saved providers:** card list (reuse the search card) with *Request a session* and *Remove* (toast with Undo). Mark providers who are no longer accepting or no longer listed.

### Build checklist
- [ ] Skeletons for the requests list, request detail and saved list.
- [ ] **Empty: My requests**: friendly line plus "Find a provider" CTA (GetYourGuide/Klarna pattern).
- [ ] **Empty: Saved**: explain the heart and its benefit (DoorDash), plus a CTA to search.
- [ ] Empty "Past" tab vs. empty "Active" tab (different copy).
- [ ] Error with Retry on each list.
- [ ] Status pill variants plus the colour/a11y check. A **Declined** state with gentle copy and alternatives. An **Expired / No response** state with a nudge.
- [ ] Request detail: timeline, submitted summary, provider snapshot plus link, Withdraw (confirmation dialog, then a toast, then the status updates).
- [ ] Provider deactivated after the request: keep the request readable, disable the profile link, show "This provider is no longer listed".
- [ ] **Guest requests are claimed** when the person later creates an account with the same verified email.
- [ ] Email notification on every status change (ties to §7 preferences). The in-app status mirrors it.
- [ ] Pagination once there are more than 20 requests (unlikely, but cheap to build).
- [ ] Saved: remove with Undo, a "no longer accepting" badge, "no longer listed" removal or greying.
- [ ] Dashboard navigation: My requests · Saved · Settings, with an active state on both mobile and desktop.

### Flags vs. Figma
- PARTIAL: a request list with "Pending answer" exists. Missing: the other statuses, request detail/timeline, withdraw, nudge, tabs, empty/error/loading states, and guest-request claiming.
- DECISION: who changes request status (the provider in their dashboard? automatic expiry after N days?), and what N is.

---

## 7. Account settings

### References reviewed
- **Delete account flows:** [Neon, "This action will immediately deactivate your account. After 30 days, this account will be permanently deleted" plus type your email to confirm](https://mobbin.com/flows/0b425b74-3af7-472e-b06e-2feb50963bbe) · [Reddit, settings tabs, then a delete modal with an optional reason, username/password, and an "I understand that deleted accounts aren't recoverable" checkbox](https://mobbin.com/flows/e0959421-eb58-41c6-829c-32f1fd888439) · [Clerk, type "Delete account" to continue](https://mobbin.com/flows/ae9a309f-fbbf-4601-b9ff-0a3f74247e57) · [Rise, "Sorry to see you go" goodbye screen](https://mobbin.com/flows/0cf33832-ccec-4613-a60b-a0c965817585)
- **Notification preferences:** [Hashnode, grouped toggles with descriptions](https://mobbin.com/screens/5e3f09d2-1e0b-416b-9d2c-d50a424de21e) · [GoFundMe, transactional vs. marketing groups plus "Subscribe to all"](https://mobbin.com/screens/2bb17b11-8490-4188-9884-562801c04f84) · [Linear, master switch plus a digest option](https://mobbin.com/screens/fbb07294-5214-4769-97e0-f2bd9f8cb36a) · [HelloFresh, reminder vs. promo emails](https://mobbin.com/screens/92478505-c6cc-46c4-b261-1a1d306ec296) · [Langdock](https://mobbin.com/screens/e180976c-3149-4ad9-a751-2264271c9c2d)
- **Data export:** [Motion, Privacy: "Download your data", Request data, and Delete information](https://mobbin.com/screens/b89cb617-27bd-4496-8ad6-6dc897409851) · [Coda, export modal explaining an emailed link with expiry and a once-a-day limit](https://mobbin.com/screens/f34fad8e-8d5b-402b-a4b8-a100bd3fe545) · [Zapier, "Download my account data", **Completed** badge, emailed ZIP](https://mobbin.com/screens/db4e2145-8a12-40a3-8c2c-a9eb61fdc245) · [Duolingo, Data Vault ("can take up to 30 days")](https://mobbin.com/screens/2a93dd58-8d48-4fb6-8300-61b82ac8194c) · [Loom, Download ZIP plus Delete](https://mobbin.com/screens/9e0dd0c6-16cd-40ab-86a7-7b7cc5b0614b)
- **Change email:** [HubSpot, new email plus password, "You'll need to check your email and validate this new address"](https://mobbin.com/screens/4fd56731-a928-477b-827b-f14528456253) · [Lindy, "Check your new email address for a verification link to finalize changes"](https://mobbin.com/screens/52ea700f-493c-4bd8-a8b5-3bef444c027e) · [Dropbox Dash, verify identity first](https://mobbin.com/screens/a4efd57a-fb54-448a-bd68-256ace9ab06a) · [Otter, validate with password plus a Forgot password link](https://mobbin.com/screens/d332436b-d4a4-4524-a3c9-586662732dc7) · [Coinbase, dedicated "Enter your new email" step](https://mobbin.com/screens/d3567ae2-279c-4c9c-aa56-43c7000516ac)

### Pattern that works best for PsychMind
A simple settings area (side nav on desktop, list on mobile) with four sections:
1. **Profile**: first/last name, phone (optional), default location (state/ZIP).
2. **Login & security**: email (change with password, verify the new address, notify the old address; Lindy/HubSpot), password (change, or **"Set a password"** for Google-only accounts), connected Google account, sign out of all devices.
3. **Email notifications**: **request status updates** are transactional, so they are always on or clearly marked as required. Optional: "Remind me if a provider hasn't responded", tips and articles, product news. Optional ones are **off by default** (GoFundMe grouping).
4. **Privacy & data**: Download my data (emailed link; Coda/Zapier states), Delete account (Neon/Reddit).

Delete account must be **honest about what can't be undone**. Requests already sent reached providers by email, so PsychMind cannot recall them. Also offer "pending requests will be withdrawn", a grace period (for example 30 days), a confirmation by typing or password, and a goodbye page.

### Build checklist
- [ ] Per-section save with success toast, validation errors, a guard against leaving with unsaved changes, and loading states.
- [ ] Change email: **pending verification** state ("Waiting for confirmation at new@..." with Resend / Cancel change), the verification-link landing page (success / expired), and a notice email to the old address.
- [ ] Change password: current password, rules checklist, mismatch, wrong current password, success, and other sessions signed out.
- [ ] Google-only account: no "current password", so offer "Set a password" instead.
- [ ] Notification toggles: autosave on toggle, a toast, revert plus an error if the save fails.
- [ ] **Unsubscribe landing page** from email footers: one click, no login, with "Manage preferences". The settings page alone doesn't cover this.
- [ ] Download my data: request, then processing (badge), then ready (emailed link, with expiry), then expired. Rate limit ("once a day").
- [ ] Delete account: consequences list, optional reason, type-to-confirm or password, an "I understand" checkbox, a pending-deletion state during the grace period (with "Cancel deletion"), and a goodbye page. Handle accounts with pending requests.
- [ ] Re-auth (password) before sensitive changes if the session is older than X minutes.
- [ ] Legal/compliance review: a mental-health directory handling notes about why someone seeks therapy. Check HIPAA applicability, state privacy laws (e.g. Washington's My Health My Data Act, CCPA) and data retention for deleted accounts.

### Flags vs. Figma
- MISSING: the entire settings area for clients (the overview lists none), unsubscribe landing, change-email verification landing, the delete-account flow, and data export.

---

## 8. Loading skeletons, offline/error pages, toasts (plus cross-cutting crisis and privacy)

### References reviewed
- **Skeletons:** Figma results skeleton ✓ · [Fabric, two-column detail skeleton](https://mobbin.com/screens/46846b8b-226e-4952-a05a-97f5b7bb11a1) · [Frame, content plus right-sidebar skeleton](https://mobbin.com/screens/482086dd-4487-417a-b11b-fcbb798e87e4) · [User Interviews, form card skeleton plus a "Saving..." indicator](https://mobbin.com/screens/2294dc8c-08b6-465a-b177-ec7473f5502f) · [Babbel, list skeleton](https://mobbin.com/screens/eb4a4034-4605-4b51-b624-da8989c143b8) · [Linktree](https://mobbin.com/screens/d120cb6e-466e-442e-9a83-1e3833c00c65)
- **404/500:** [Headspace, "We all get lost sometimes" (gentle health-brand 404) plus Go back](https://mobbin.com/screens/f8e16f35-df5d-4f58-bdd2-cb93ce432ada) · [Coinbase, Page not found plus a back link](https://mobbin.com/screens/7484e648-c0ba-4ffa-888c-30c36d53ab32) · [Aboard, "Something went wrong, here's a lifebuoy" plus Back home](https://mobbin.com/screens/3f5f6e3a-a213-4290-b700-4d6ee8988e92) · [Charma, 500 with an apology plus a support email](https://mobbin.com/screens/ac63be88-d259-4f46-8846-56301617e894) · [Care.com, in-page error plus Retry](https://mobbin.com/screens/859e00b8-b2c4-47cb-bc19-61bf0c536c91)
- **Toasts:** [Netflix, "X has been removed from My List" plus **Undo**](https://mobbin.com/screens/5211d5f6-c653-4210-aead-047adec26c9a) · [Pinterest, compact toast plus Undo](https://mobbin.com/screens/70234394-ca14-4def-8aa4-e9784fdccae1) · [Asana, toast with Undo plus a dismiss button](https://mobbin.com/screens/36cb9092-004d-4cfa-abc7-930e4a7ff931) · [Coda, "moved... Undo"](https://mobbin.com/screens/580abcac-fdb0-4c72-b6ea-b529d42bfa1e) · [Gamma, top info toast plus Undo](https://mobbin.com/screens/c9459cb9-aca6-46ff-83af-ac5ada6d6d03)
- **Crisis resources:** [Alan (iOS), "Help is available": numbers that are "free, confidential, and available 24/7", each with a Call button, plus "Alan is not suited for crisis situations"](https://mobbin.com/screens/aa6b489c-b86c-4492-b477-f3ee9f295810) · [Alan (iOS), crisis card inline on the therapist profile](https://mobbin.com/screens/ed903d4c-3065-4f73-a2f4-f7c6852d3736) · [How We Feel (iOS), "Call or text 988" by country](https://mobbin.com/screens/eb0a66d8-4e0d-443b-8c4f-b0b88ef5535a) · [Wysa (iOS), "Are you in crisis? You are not alone" plus helplines plus a safety plan](https://mobbin.com/screens/de96d391-118b-4684-add3-62a5634d2d7e) · [Bloom (iOS), shows the **outdated** 1-800-273-TALK number. An anti-pattern: use 988.](https://mobbin.com/screens/9a7c29f6-faae-40c9-9a16-bc339fa12e8f) · [DoorDash Dasher (iOS), always-available emergency action](https://mobbin.com/screens/5f829794-614d-4369-babc-c961c9923e70) · [Heidi, a "this tool is not for..." disclaimer](https://mobbin.com/screens/7f365646-e55c-40d9-80fc-141b17dc5d42)

### Pattern that works best for PsychMind
- **Skeletons that mirror the final layout** for every data route: results ✓, profile (two-column), My requests, request detail, Saved, settings. In Next.js these become `loading.tsx` per route segment. Use spinners only inside buttons.
- **Errors:**
  - `not-found.tsx`: gentle, Headspace-style tone with Search providers / Home links.
  - A **provider-specific not-found** (§4).
  - `error.tsx` per segment: in-place "Something went wrong" plus **Retry** (Care.com), with the rest of the page still usable.
  - `global-error.tsx`: a calm 500 page with a support contact.
  - All of them include a small crisis line.
- **Offline:** a slim banner ("You're offline. We'll reconnect automatically."). Forms keep their data and Submit is blocked with an inline message, not a toast.
- **Toasts:** bottom-centre on mobile, bottom-left on desktop, `aria-live="polite"`, 4–6 s, one at a time. **Undo** for reversible actions (unsave, withdraw within a few seconds?). Never use a toast for blocking errors (use inline), and **never put sensitive content in a toast** ("Request sent to Dr. X about anxiety" is visible on a shared screen). Keep them generic: "Request sent".
- **Crisis resources:**
  - A persistent "Need help now?" link in the header or footer that goes to a `/crisis` page (Alan pattern) listing 988 (call/text, plus chat at 988lifeline.org), 911, and optionally the Crisis Text Line. Each number is a tappable `tel:`/`sms:` link.
  - Inline crisis cards on the profile and on the request note step.
  - The line on the confirmation page and on error pages.
  - A plain disclaimer that PsychMind is a directory and not an emergency service. This copy already exists in the T&Cs.

### Build checklist
- [ ] `loading.tsx` skeletons for /search ✓, /providers/[id], /account/requests, /account/requests/[id], /account/saved, /account/settings.
- [ ] `not-found.tsx` (global) plus provider not-found plus request not-found (someone else's ID returns 404, not 403, to avoid leaking information).
- [ ] `error.tsx` with Retry per segment, and `global-error.tsx`.
- [ ] Offline banner (`navigator.onLine` plus fetch failure). Forms are kept and resubmit is blocked.
- [ ] Toast system: success / info / error variants, an Undo action, a dismiss button, a11y, a stacking limit, and a reduced-motion setting.
- [ ] Toast inventory: saved / removed (Undo), request sent, request withdrawn, settings saved, email verification sent, password updated, signed in / out, link copied.
- [ ] Crisis: `/crisis` page, header/footer link, inline cards (profile, request note, confirmation, error pages). Verify numbers yearly. **Never use 1-800-273-TALK** (replaced by 988).
- [ ] Privacy reassurance placed where data is entered (request contact step and Review), not only on cards. The wording must be accurate (see §2 flag).

### Flags vs. Figma
- PRESENT: results skeleton only.
- MISSING: other skeletons, 404/500/offline pages, the toast component and its inventory, the crisis page and inline crisis cards. Per project memory, the marketing site already has a 988 Lifeline button; the app screens do not.

---

## Open decisions for the client/PM (blocking the build)
1. Guest requests allowed? (Figma says yes; the brief says patients have accounts.) If yes, verify the email before sending and let guests claim requests on sign-up.
2. Social login: Google only, or Google + Apple?
3. Request status model: who sets it (the provider dashboard?), auto-expiry after N business days, and a "Closed" state.
4. Relaxation order for "close enough" results, and which filters are never relaxed (state licensure).
5. Insurance filter and "I accept insurance": hide until decided?
6. "Your info is never shared": confirm the intended meaning, since the request flow shares contact details with the chosen provider.
7. "Call provider": is the provider phone number public?
8. Phone field on the request: required or optional? Add a voicemail-OK preference?
9. Account holder age (18+) and requests for minors (guardian flow).
10. Legal review: health-data privacy laws (WA MHMDA, CCPA), deletion and retention, and consent wording on Review.
