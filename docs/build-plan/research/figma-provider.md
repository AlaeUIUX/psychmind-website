# PsychMind — Provider-side Figma audit (build-ready inventory)

Source: Figma file `Iz0bLN6x4KoY06gYu2Mi8w`, page **Design File** (`108:121`), section **Provider Dashboard** (`255:1412`).
Method: every frame was read through the Figma Plugin API (read-only script that dumps each frame's text nodes with their real `characters`, instance variant props, fills and hidden flags), with screenshots for layout and state. **Layer names do not match the text on screen.** For example, every wizard heading layer is named "Heading 1 → Create your account", and every wizard frame is named "Psychmind - Create account - Step 1". All copy below is the real rendered text, not the layer name.
Audited 2026-10-07. Nothing in Figma or code was modified.

Copy is client-approved. It is reproduced **verbatim**, including typos, and these are flagged in §9 rather than corrected. Typographic characters are kept exactly: `·` (middle dot), `—` (em dash), `–` (en dash), curly quotes and apostrophes, and non-breaking spaces where noted.

---

## 0. TL;DR

- **39 frames** in `255:1412`: 18 desktop (1600 px wide) and 21 mobile (402 px wide). They are split across 3 sub-sections:
  - `255:1413` **Access Screens**: 4 frames. Role pick and provider sign-up.
  - `255:1539` **Provider creator**: 25 frames. Pricing intro, the onboarding wizard, the location-limit/upgrade state, and credentials.
  - `337:2210` **Dashboard**: 10 frames. Analytics, the public-profile preview, the blog list, and the blog editor.
- The **wizard** has these screens: identity → picture → story → participants/ages → specialties/approaches/languages → practice locations (+ plan limit/upgrade) → credentials & verification. The step counter shows "Step 1 of 5" … "Step 5 of 5", then "Final step", but there are actually **7 distinct steps**. Numbering is inconsistent (§9).
- The **dashboard** has 3 nav destinations that are designed (Analytics, Blogs, Profile). The 4th nav item, **Settings**, has **no screen**.
- There is **no in-dashboard profile editor**. The "Profile" page is a read-only preview labelled "This is a preview". Editing exists only inside the onboarding wizard, which has a live side preview.
- **Not designed anywhere in `108:121`:**
  - Billing/subscription management
  - Payment entry
  - Failed-payment or paused states
  - Verification pending/approved/rejected states
  - Settings
  - Notifications
  - Session-request detail
  - Error/validation states
  - Any admin screen
- Top-level sections of `108:121` are: Landing pages `108:123`, Legal pages `150:3232`, User Dashboard `150:3857`, Provider Dashboard `255:1412`, Assets `656:2889`. **No admin section exists**, and a full-page text search for admin/approve/reject/pending/moderation found nothing admin-like.

---

## 1. Frame inventory (all 39 frames)

Canvas order is left → right. "D" = desktop 1600 w, "M" = mobile 402 w (iPhone status bar).

### 1a. Access Screens — `255:1413`

| # | Node | D/M | Size | Flow / step | What it is |
|---|------|-----|------|-------------|------------|
| A1 | `255:1414` | D | 1600×1000 | Sign-up, "Step 1 of 2" | Role selection ("Who are you joining as?"), with "I am a provider" selected |
| A1m | `284:9596` | M | 402×874 | same | Mobile of A1 |
| A2 | `255:1463` | D | 1600×1000 | Sign-up, "Step 2 of 2" | Provider account creation form (name, business name, email, password, Google) |
| A2m | `284:9661` | M | 402×874 | same | Mobile of A2. **Subtitle uses patient copy** (§9) |

Login, forgot-password and reset screens are **not** in the provider section. They live in the shared `148:189` "Access Screens" inside User Dashboard `150:3857`:

- `148:1630` Login
- `150:2501` / `150:2677` / `150:2615` Reset steps 1–3
- Mobile versions `276:5294`, `276:5385`, `276:5456`, `276:5521`

Providers presumably reuse these.

### 1b. Provider creator — `255:1539`

| # | Node | D/M | Size | Wizard step (as labelled on screen) | State shown |
|---|------|-----|------|------|------|
| P0 | `284:9738` | D | 1600×1000 | Pre-wizard "For providers" | Pricing/value intro, "Get started" CTA. Price **$10** / month |
| P0m | `314:7360` | M | 402×958 | same | Price **$39** / month. Heading wording differs |
| P1a | `260:1802` | D | 1600×1000 | "Step 1 of 5" Your identity | **Empty**: placeholders, Save disabled, preview shows placeholders ("Full name", "Title / credentials") |
| P1am | `314:7457` | M | 402×942 | same | Empty. Header has "Preview profile" button |
| P1b | `260:2081` | D | 1600×1000 | "Step 1 of 5" Your identity | **Filled** (Sara Oliisi). Save enabled. Teal banner selected |
| P1bm | `314:7910` | M | 402×898 | same | Filled, **but Save still shown disabled** (§9) |
| P2a | `268:698` | D | 1600×1000 | "Step 2 of 5" Your identity (picture) | **No file chosen**, Save disabled |
| P2am | `314:7990` | M | 402×874 | labelled **"Step 1 of 5"** (§9) | same state |
| P2b | `268:850` | D | 1600×1000 | "Step 2 of 5" | **File chosen** (IMG_5052.png), Save enabled, photo appears in preview |
| P2bm | `314:8083` | M | 402×874 | labelled "Step 1 of 5" | same state |
| P3 | `268:927` | D | 1600×1000 | "Step 3 of 5" Your story | Filled textareas. Preview shows the "Who I work with" and "About Sara" sections |
| P3m | `314:8134` | M | 402×1096 | same | — |
| P4a | `268:1037` | D | 1600×1000 | "Step 4 of 5" Your expertise | Session participants and age-groups chips (3 of 4 selected in each) |
| P4am | `314:8232` | M | 402×874 | same | — |
| P4b | `268:1191` | D | 1600×1136 | "Step 4 of 5" Your expertise (again) | Specialties, therapy approaches, languages |
| P4bm | `316:8305` | M | 402×1078 | same | — |
| P5a | `268:1476` | D | 1600×1442 | "Step 5 of 5" Practice locations | "2 of 3 locations used". One saved location collapsed, one "Add a new location" form expanded. License-compliance side card |
| P5am | `316:8614` | M | 402×1520 | same | Compliance alert moved to top. Saved location is Texas, TX |
| P5b | `297:1708` | D | 1600×1442 | "Step 5 of 5" | **Limit reached**: "3 of 3 locations used", dark upsell alert, "Upgrade for more". The "Add another location" button is removed |
| P5bm | `316:8430` | M | 402×1108 | same | Same. "Add another location" is still present on mobile (§9) |
| P5c | `297:1864` | D | 1600×1000 | Modal over wizard | **Upgrade your plan** modal (Basic vs Upgrade +$5/location) |
| P5cm | `317:8806` | M | 402×874 | same | Full-page version of the modal |
| P6 | `309:7111` | D | 1600×1258 | "Final step" Credentials & verification | Per-state accordion. Texas expanded with license upload (file chosen) and fields; NY and Phoenix collapsed. Illustration on the right |
| P6m | `323:1974` | M | 402×1342 | same | — |
| PV | `314:7594` | M | 402×2841 | Mobile full-screen profile preview | Opened by "Preview profile". Header button "Go to editor" |

### 1c. Dashboard — `337:2210`

| # | Node | D/M | Size | Page | State shown |
|---|------|-----|------|------|------|
| D1 | `338:2214` | D | 1600×2463 | **Analytics** | Populated sample data, profile "Live" |
| D1m | `339:4139` | M | 402×2459 | Analytics | Filters collapsed to dropdowns. Different sample search terms. No "Live" badge |
| D2 | `339:5155` | D | 1600×3163 | **Profile**: "Your public profile" | Read-only preview of the public profile ("This is a preview") |
| D2m | `343:2399` | M | 402×3326 | Profile | Mobile preview. Includes "Responds within 48h" / "Message before request" |
| D3 | `343:2931` | D | 1600×4107 | **Blogs**: "Your blogs" | Table of 7 posted blogs plus a "Resource center" teaser of other providers' blogs |
| D3m | `343:9907` | M | 402×4333 | Blogs | Table uses template leftovers ("File size" column) |
| D4 | `343:10834` | D | 1600×3201 | **Blog editor**: "Add new blog" › "Draft" | Block-editing mode: each block in a labelled input |
| D5 | `343:11285` | D | 1600×6191 | Blog editor | Composed/rendered article mode (WYSIWYG content items) |
| D5m | `343:11704` | M | 402×6001 | Blog editor | Mobile of D5 |
| D4m0 | `343:12172` | M | 402×1602 | Blog editor | **Empty new blog** (no blocks yet). Mobile only |

Frame names in this section are template leftovers ("Psychmind - Search results", "Psychmind - Landing page - Mobile"). Ignore them.

**Count:** Access 4 + Creator 25 + Dashboard 10 = **39 frames**, which makes **~17 unique screen templates** (8 wizard, 2 sign-up, 1 pricing, 1 modal, analytics, profile preview, blog list, blog editor, mobile full preview).

---

## 2. Global chrome

### Wizard and sign-up layout (desktop)

- A centered white card (radius 14–16, border `#e5e5e5`) on a `#f5f5f4` page.
- Left column is the form (≈383 px).
- Right column is one of:
  - a hero image (sign-up, pricing)
  - a **live profile preview** (wizard steps 1–4)
  - a "License compliance" info card (step 5)
  - a line illustration (credentials)
- **Step indicator** is text only: "Step **1** of 5" (number in darker ink). There is **no progress bar**.
- Heading font is serif display (Ivar Text). Body font is Geist.
- **Primary button:**
  - Brand `#c01048` with text `#fafafa`.
  - **Disabled:** bg `#e7e5e4`, text `#79716b`.
  - Upgrade CTAs use a near-black button `#171412`.
- **Secondary button** is "Go back", with a left-arrow icon, bg `#fafaf9`, border `#e5e5e5`.
  - Absent on desktop Step 1.
  - Present on every mobile step.
- **Required marker:** red `*` after the label, e.g. "First name *".
- **Optional marker:** right-aligned grey "Optional".
- **Chip/badge multi-select:**
  - Selected = filled `#292524` with white text.
  - Unselected = white with `#d7d3d0` border and `#44403c` text.
  - Chips are toggles.

### Wizard on mobile

- The header shows the PsychMind logo plus a right button:
  - "Go back" on sign-up/pricing/upgrade
  - "Preview profile" on wizard steps
  - "Go to editor" on the preview
  - Credentials (`323:1974`) has only the logo.
- Footer on the sign-up/pricing mobiles: "© 2026 PsychMind. All rights reserved."

### Dashboard header (desktop)

- PsychMind logo.
- Center nav: **Analytics · Blogs · Profile · Settings**.
- Right: an avatar pill ("Annah Solto" with chevron), which suggests a dropdown that is not designed.
- **No active-tab state** is shown.

### Dashboard header (mobile)

- Logo plus avatar pill with chevron. Nav links are not visible.
- The blog list mobile (`343:9907`) instead shows a hamburger `menu` icon.

### Dashboard page structure

- Breadcrumb, e.g. "Analytics › Sara Oliisi", "Profile › Sara Oliisi", "Blog › Add new blog › Draft".
- Big page title.
- Subtitle.

### Dashboard footer

The **patient marketing footer** is used. It contains:
- "Ready to find help?" / "It takes less than two minutes. No referral needed" / "Browse all"
- Links: Browse providers, How it works, Blog, Contact, Blog, Privacy Policy, Terms of Usage, Cookie Policy
- Buttons: "Log in" / "Create account"
- "© 2026 PsychMind. All rights reserved."
- 4 social icons: Instagram, X, YouTube, LinkedIn

This is wrong for a logged-in provider (§9).

---

## 3. Screen-by-screen detail

### A1 — Role selection: `255:1414` (D), `284:9596` (M)

| Element | Copy / spec |
|---|---|
| Step | "Step 1 of 2" |
| H1 | "Who are you joining as?" |
| Sub | "This helps us set up the right experience for you." |
| Group label | "Choose account type" |
| Option card 1 (unselected, user icon) | "I am looking for a provider" / "Find and connect with a verified mental health professional." |
| Option card 2 (**selected**: brand-red border `#e31b54`, filled check-badge icon) | "I am a provider" / "Create a profile and connect with people who need your support." |
| Primary | "Continue" → A2 |
| Link | "Already have an account? **Sign in**" (Sign in underlined) → Login `148:1630` |
| Legal (below card) | "By clicking continue, you agree to our Terms of Service and Privacy Policy." (both underlined links). Desktop only |
| Right panel | Mountain painting image. A hidden credit ("Illustration by Ollie Watson" with X social button) exists at opacity 0 |
| Mobile | Header "Go back". Footer © line |

States: single-select radio cards, provider selected. No error state is shown.

### A2 — Create account (provider): `255:1463` (D), `284:9661` (M)

| Field | Label | Placeholder | Type | Req? | Notes |
|---|---|---|---|---|---|
| First name | "First name" | "John" | text | not marked (implied) | half width |
| Last name | "Last name" | "Doe" | text | not marked | half width |
| Business name | "Business name" + "Optional" | "e.g. ThinkWell Therapy Center" | text | optional | — |
| Display-as-business toggle | checkbox, shown **checked** | — | checkbox card | — | Title "Enlist with business name", helper "Your full name will not show, and your profile will feature the business name" |
| Email | "Email" | "m@example.com" | email | — | — |
| Password | "Password" | masked dots | password | — | half width |
| Confirm password | "Confirm Password" | masked dots | password | — | half width |
| Helper | "Must be at least 8 characters long." | | | | under both password fields |

- Step "Step 2 of 2". H1 "Create your account". Sub (desktop) "Let's build your professional profile."
- **Mobile sub instead says:** "You are one step away from finding your provider." (patient copy, §9)
- Primary "Create Account" → P0 pricing intro (canvas order).
- Divider "Or continue with", then a full-width **Google** icon button (OAuth).
- "Already have an account? Sign in".
- Legal line: "By clicking continue, you agree to our Terms of Service and Privacy Policy."
- No validation, error, or email-verification states are shown.

### P0 — Provider pricing intro: `284:9738` (D), `314:7360` (M)

| Element | Copy |
|---|---|
| Eyebrow | "For providers" |
| H1 (desktop) | "Reach people who / are ready to start" (line break after "who"; NBSPs around "ready") |
| H1 (mobile) | "Reach patients who are ready to start" |
| Sub | "Psychmind connects verified mental health professionals with people actively looking for help." |
| Price card | "**$10**" + "/ month" (desktop) — **"$39" + "/ month" on mobile**. Then "Base plan · 3 licensed states", with a small armchair illustration |
| Plan blurb | "Everything you need to get started and start receiving session requests." |
| Feature list (icons) | "Cancel anytime" (x-circle) · "Manual verification — 1 to 2 days" (document) · "No commission on sessions" ($ coin) · "Your patient data stays private" (shield) |
| Meta line | "Takes about 20 minutes ·  Goes live after verification  1-2 days" ("1-2 days" in brand red) |
| Primary | "Get started" → P1 |
| Legal | "By clicking “Get started”, you agree to our Terms of Service and Privacy Policy." |
| Right panel | Photo of a therapy session |

No payment is collected here and no card form exists anywhere (§10).

### P1 — Your identity (name, title, pronouns, banner)

Frames:
- **Empty:** `260:1802` (D), `314:7457` (M)
- **Filled:** `260:2081` (D), `314:7910` (M)

Step: "Step 1 of 5". H1 "Your identity". Sub "This is the first thing patients see. Make a strong, warm first impression."

| Field | Label | Placeholder (empty) | Filled sample | Type | Req | Helper |
|---|---|---|---|---|---|---|
| first_name | "First name *" | "John" | "Sara" | text | yes | — |
| last_name | "Last name *" | "Doe" | "Oliisi" | text | yes | — |
| title_credentials | "Title / credentials *" | "e.g: Clinical Psychologist, Ph.D." | "Counselor, LMHC, M.S., B.S." | text (free) | yes | "Appears below your name on your profile." |
| pronouns | "Pronouns" + "Optional" | desktop "e.g: They/Them"; mobile "e.g: She/her" | "She/her" | text (free) | no | — |
| banner_style | "Banner style" + "Optional" | 12 swatches, 4×3 grid | teal (row 1, col 4) selected | single-select swatch | no | — |

**Banner swatches:**
- Each swatch is the same brush-texture image recoloured with image filters. Rows 3/3–4 also add hue overlays `#ffbf00` and `#ff8f53`.
- Visual order:
  - Row 1: deep blue · dark green · light grey · teal
  - Row 2: near-black navy · slate grey · emerald/teal-green · bright blue
  - Row 3: pink · violet · mustard/gold · orange
- Selected state: white check-circle in the corner, and a brand-red border on mobile.
- Empty-state sample selects orange.
- **Export the 12 rendered swatches as assets.** They cannot be rebuilt from flat hex values.

**Buttons:**
- "Save and continue": disabled when empty, enabled when filled.
- Desktop has no "Go back" on step 1. Mobile has "Go back".

**Live preview (desktop right panel):**
- "Preview" badge.
- A profile header card:
  - Banner in the chosen style.
  - Square avatar (placeholder user icon until P2).
  - "Go back to results" pill button on the banner (§9).
  - Name ("Full name" placeholder → "Sara Oliisi").
  - "Verified" badge (check-badge icon). Shown even before verification (§9).
  - Title line with check-badge icon ("Title / credentials" → "Counselor, LMHC, M.S., B.S."), then pronouns ("she/her").
  - An empty chip placeholder.
  - "Responds within 48h" (clock icon) and "Message before request" (chat icon).

### P2 — Your identity (picture)

Frames:
- **Empty:** `268:698` (D), `314:7990` (M)
- **Chosen:** `268:850` (D), `314:8083` (M)

- Step "Step 2 of 5" on desktop, "Step 1 of 5" on mobile. H1 "Your identity". Same sub as P1.
- **Field "Picture *"** (required):
  - Dashed dropzone with image icon.
  - "Choose file" + filename ("No file chosen" → "IMG_5052.png").
  - Helper "Select a picture to upload."
  - **No accepted types or max size are stated** (§10).
- Buttons: "Save and continue" (disabled until a file is chosen), "Go back".
- Preview shows the uploaded photo in the avatar slot.

### P3 — Your story: `268:927` (D), `314:8134` (M)

Step "Step 3 of 5". H1 "Your story". Sub "Help clients understand who you are and how you work before they book."

| Field | Label | Type | Req | Helper | Sample value (verbatim) |
|---|---|---|---|---|---|
| who_you_work_with | "Who you work with *" | textarea | yes | "Maximum 1600 words." | "I primarily work with adults (18+) on an individual basis, though I also offer couples sessions. My clients often come to me when they feel like they've tried to manage things on their own and need a different kind of support — not advice, but a space to think more clearly.⏎I work especially well with people who are skeptical about therapy, or who have tried it before and felt it wasn't quite right. I take that seriously and we talk about it openly." |
| about | "About you *" | textarea | yes | "Maximum 1600 words." | "I work with adults who feel stuck, overwhelmed, or disconnected from the life they want to be living. Many of my clients are navigating anxiety, stress, relationship challenges, or questions about identity — and they've often been carrying these things alone for a long time before reaching out.⏎My approach is collaborative and paced to your comfort. I don't believe therapy should feel like homework or a checklist. I believe it should feel like a conversation where you are genuinely heard — sometimes for the first time." |

(⏎ = paragraph break, so multi-paragraph plain text is supported.)

**Preview** adds these sections:
- "**Who I work with**": the text, then 3 empty chip placeholders. These are filled from P4a selections later.
- "**About Sara**" ("About {first_name}"): the text plus a "Read more" link (truncation).

Buttons: "Save and continue", "Go back".

### P4a — Your expertise (participants and ages): `268:1037` (D), `314:8232` (M)

Step "Step 4 of 5". H1 "Your expertise". Sub "Help clients understand who you are and how you work before they book."

| Field | Label | Type | Req | Helper | Options (verbatim, in order) | Selected in sample |
|---|---|---|---|---|---|---|
| session_participants | "Session participants *" | multi-select chips | yes | "Choose all that apply" | Individuals · Couples · Families · Groups | Individuals, Couples, Families |
| age_groups | "Age groups served *" | multi-select chips | yes | "Choose all that apply" | Children · Teens · Adults +18 · Seniors | Children, Teens, Adults +18 |

Preview: the "Who I work with" chips now render "Individuals", "Couples", "Families".

### P4b — Your expertise (specialties, approaches, languages): `268:1191` (D), `316:8305` (M)

Step "Step 4 of 5" (repeated). H1 "Your expertise". Sub **"Help patients understand who you are and how you work before they book."** (says "patients", not "clients").

| Field | Label | UI | Req | Helper |
|---|---|---|---|---|
| specialties | "Specialties *" | text input (placeholder "Add more") + inline link-button "Add specialty" (adds a **custom** value), then a chip grid | yes | "Choose all that apply" |
| therapy_approaches | "Therapy approaches *" | input "Add more" + "Add approach" (custom), then chip grid | yes | "Choose all that apply" |
| languages | "Languages *" | select-like input "Choose a language" + "Add language", then **removable chips** (label + ×) | yes | — |

**Specialties** (chip order verbatim; ● = selected in sample):
- ● Anxiety
- ● Grief & loss
- ● Burnout
- Relationships
- Cultural identity
- Trauma & PTSD
- Groups
- Depression
- Self-esteem
- Life transitions

**Therapy approaches**:
- ● CBT
- ● Mindfulness
- DBT
- EMDR
- Person-centered
- Narrative
- Attachment-based
- ● Psychodynamic

**Languages** (chips shown): English ×, French ×, Arabic ×. **No full language list is in the file.**

**Preview** adds:
- "**Specialties**": grouped under uppercase category subheads:
  - "Anxiety & mood": chips **Individuals, Couples, Adults 18+** (wrong data, §9)
  - "Trauma": Trauma & PTSD, Grief & loss
  - "Relationships & identity": Relationship issues, Self-esteem, Life transitions, Cultural identity
- "**Credentials & qualifications**" two-column definition list:
  - LICENSE: 2 empty placeholders
  - EDUCATION: 2 empty placeholders
  - EXPERIENCE: 1 empty placeholder
  - LANGUAGES: "French, English, Arabic"
  - SESSION TYPES: "Individual · Couples"

This implies specialties belong to **categories**. The category list is only partially visible: "Anxiety & mood", "Trauma", "Relationships & identity".

### P5a — Practice locations (under the limit): `268:1476` (D), `316:8614` (M)

Step "Step 5 of 5". H1 "Practice locations". Sub "Add the states where you are licensed to practice. Your base plan includes up to 3 locations." (trailing space in source)

**Plan usage card:**
- "Base plan" / "2 of 3 locations used".
- 3-segment progress meter: 2 brand-red segments, 1 grey.

**Button:** "+ Add another location" (secondary, full width).

**Saved location (collapsed accordion):**
- Title "New York, NY". Sub "In-person & Online · Primary location".
- Chevron-down toggle.
- Mobile sample: "Texas, TX" / "In-person & Online".

**New location (expanded accordion):** title "Add a new location", sub "Fill the form with the details", chevron-up.

| Field | Label | Placeholder | Type | Req | Helper |
|---|---|---|---|---|---|
| state | "State *" | "New York" | **text input in the design** (should be a US-state select, §10) | yes | — |
| city | "City *" | "New York" | text | yes | — |
| practice_name | "Practice name" + "Optional" | "e.g: Manhattan Mind Clinic" | text | no | — |
| address | "Address" + "Optional" | desktop "Address here"; **mobile "she/her"** (§9) | text | no | "Only shown publicly if you offer in-person sessions at this location." |
| session_format | "Session format at this location *" | — | multi-select chips: **Online** (selected) · **In-person** | yes | — |
| is_primary | checkbox "Primary location" (checked) | — | checkbox | — | — |
| remove | "Remove location" (trash icon; icon-only on mobile) | — | button | — | — |

**Right panel / mobile top: info alert**, with an info-circle icon:
- Title "License compliance".
- Body: "You may only list states where you hold a valid, active license.⏎⏎Adding a state without a license violates professional regulations and Psychmind's terms.⏎⏎We verify this against your submitted credentials."

Buttons: "Save and continue", "Go back".

### P5b — Practice locations (limit reached): `297:1708` (D), `316:8430` (M)

**Dark upsell alert** (bg `#292524`, star icon):
- "You've reached your 3-location limit"
- "Your base plan includes 3 licensed states. Upgrade to add more locations and expand your patient reach."
- Button **"Upgrade for more"** → P5c modal.

**Usage card:** "Base plan" / "3 of 3 locations used".

**Three collapsed location cards:**
- "Texas, TX" / "In-person & Online · Primary location"
- "New York, NY" / "In-person & Online "
- "Pheonix, AZ" / "In-person & Online " (sic)

On desktop the "Add another location" button is gone. On mobile it is still shown.

Desktop keeps the License compliance card. Buttons: "Save and continue", "Go back".

### P5c — Upgrade your plan (modal): `297:1864` (D overlay), `317:8806` (M full page)

- Header: featured icon (credit-card-refresh). Title "Upgrade your plan". Sub "Flexible pricing that grows with you."
- **Option 1** (checkbox-style radio, **checked**): "Basic plan" / "3 locations free".
- **Option 2** (unchecked): "Upgrade plan" / "$5 extra per location".
  - Nested field "Number of additional locations", placeholder "Digits only" (numeric).
  - Helper "Only add additional locations needed, your plan already features 3 " (sic: trailing space, no period).
- Two more radio items exist but are **hidden**. These are reserved for future plans.
- Actions: **"Upgrade plan"** (near-black primary), "Go back".
- Mobile header shows "Go back".
- No price total, proration, payment method, or confirmation/success state is shown.

### P6 — Credentials & verification: `309:7111` (D), `323:1974` (M)

Eyebrow "Final step". H1 "Credentials & verification". Sub "We manually verify every provider before their profile goes live. This usually takes 1–2 business days." (en dash)

There is **one accordion card per licensed state from P5**:
- "Texas, TX" (expanded), "New York, NY", "Pheonix, AZ" (collapsed).
- Each card sub reads "Fill the form with the details".

Fields inside each state card:

| Field | Label | Placeholder / sample | Type | Req | Helper |
|---|---|---|---|---|---|
| license_document | "Upload license document *" | dropzone, "Choose file" + "License_Sara.pdf"; inner caption "PDF, JPG or PNG · Max 10MB" | file upload | yes | "Your document is only seen by the Psychmind verification team. It is never shared publicly." |
| license_number | "License number *" | "e.g. SA-2665" | text | yes | — |
| npi_number | "NPI number *" | "e.g. SA-2665" (same placeholder as license, §9) | text (should be 10-digit numeric) | yes | — |
| issuing_body | "Issuing body *" | "e.g. Academy X of Psychology " | text | yes | — |
| years_experience | "Years of experience" + "Optional" | "e.g. 9" | number | no | — |

- Buttons: **"Save and continue"** (there is no distinct "Submit for verification" label), "Go back".
- Right panel: line illustration of two people reviewing a document.
- **Nothing is designed after this step**: no "submitted / under review" screen.

NPI is a person-level identifier, but the design captures it per state (§10).

### PV — Mobile full profile preview: `314:7594`

- Header button "Go to editor". Breadcrumb "Preview › Sara Oliisi".
- Renders the full public profile (same as D2, see §5).
- **Mobile adds a "Send a message" button** (mail icon) between "Request a session" and "Call provider". This conflicts with the no-messaging rule (§9).

### D1 — Analytics: `338:2214` (D), `339:4139` (M)

**Header:**
- Breadcrumb "Analytics › Sara Oliisi".
- H1 "Analytics".
- **Status badge "Live"** with green dot. This is desktop only, and it is the only profile-status state designed.
- Sub "Track your performance on PsychMind, and use insights to generate more leads."

**Profile strip:** avatar, "Sara Oliisi", "Counselor, LMHC, M.S., B.S.", then two buttons:
- **"View public profile"** → presumably D2
- **"Edit profile"** (pencil icon) → target not designed

**Overview card:**
- Title "Overview".
- Segmented time filter: **Last 7 days** (selected, dark) · Last 30 days · Last 3 months · Custom. On mobile this is a dropdown "Last 7 days ⇕".
- KPI tiles: label, value, and a delta pill (green `#079455` for positive, red `#d92d20` for negative, neutral grey for zero):

| Metric (label verbatim) | Value | Delta | Notes |
|---|---|---|---|
| Conversion rate | 6.9% | +2.5% | full-width tile. **6.9% = 24 session requests ÷ 347 profile views**, so the formula is likely requests/views |
| Impressions | 1,284 | +250 | times the profile appeared in search results |
| Profile views | 347 | -12 | red delta |
| Session requests | 24 | +2 | |
| Saves | 61 | +0.0 | neutral delta. Note the odd "+0.0" format on a count |

**Trend chart card:**
- Metric dropdown "Impressions ⇕". Options presumably = the 5 metrics; not shown open.
- Its own time filter: Last 7 days · Last 30 days · Last 3 months · Custom (dropdown on mobile).
- **Line chart with gradient area fill** (component "Line and bar chart", style Line).
- Y-axis label "Impressions", ticks 0, 200, 400, 600, 800, 1,000.
- X-axis label "Month", ticks Jan, Mar, May, Jul, Sep, Nov, Dec. This 12-month axis contradicts "Last 7 days" (§9).

**"How patients found you" card:**
- Right label "Top search terms".
- Ranked keyword list with horizontal bars and counts. Desktop sample:
  - "Anxiety therapist New York" 142
  - "Trauma therapist online" 108
  - "Child psychologist near me" 50
  - "Cognitive behavioral therapy " 31
  - "Stress management " 23
- Mobile sample is different, all 50:
  - "Help with trauma"
  - "Trauma therapist online"
  - "Stress management "
  - "Female stress management "
  - "Anxiety therapist New York"
- Footnotes (with icons):
  - "Search results are updated everyday" (clock)
  - "This visual helps optimizing for keywords" (sparkle/nodes)

**"Recent session requests" card:**
- Right label "24 total".
- Rows show patient name (first name + last initial), "{participant type} · {format}", and a relative date:
  - "Sara A." / "Individual · Online" / "Today"
  - "Youssef B." / "Individual · In-person" / "Yesterday"
  - "Nadia E." / "Couples · Online" / "Apr 6th"
  - "Lina S." / "Couples · Online" / "Apr 6th"
- Rows show no click affordance and there is no "view all" link.

States shown: populated only.
- No empty, loading or error states.
- No custom-date picker.
- No tooltips or metric definitions.

### D2 — Profile ("Your public profile"): `339:5155` (D), `343:2399` (M)

- Breadcrumb "Profile › Sara Oliisi". H1 "Your public profile".
- Sub "Track your performance on PsychMind, and use insights to generate more leads." This is copy-pasted from Analytics (§9).
- Below it is the full public profile in read-only form, with a floating pill **"This is a preview"** on the banner.
- **There are no edit controls on this page.** The field-by-field render is in §5.

### D3 — Your blogs (list): `343:2931` (D), `343:9907` (M)

**Hero:** book illustration. H1 "Your blogs".
- Desktop sub: "Guides, insights, and perspectives on mental health — written by you"
- **Mobile sub:** "… — written by our experts" (§9)

**Table card:**
- Header "Blogs posted". The card header also has a badge, 2 more buttons and a dropdown, all **hidden**.
- Primary button **"Add blog"** (upload-cloud icon) → D4.
- Desktop columns:
  - "Blog title": doc icon, title, and author line
  - "Date posted"
  - "Category": badge
  - **"Company"**: template leftover. This column actually holds the row actions "Delete" (grey link) and "Edit" (brand link)
- Rows (title / author / date / category):
  1. "How to know when you're ready to start therapy — and what to expect" / Dr. Danny Schwelberg / Jan 4, 2025 / Design
  2. "The science of happiness: Proven strategies for a joyful life" / Dr. Danny Schwelberg / Jan 4, 2025 / Mental health
  3. "Understanding trauma: A guide to healing and recovery" / Dr. Danny Schwelberg / Jan 2, 2025 / Research and Dev
  4. "The power of mindfulness: Reduce stress and increase well-being" / Dr. Danny Schwelberg / Jan 6, 2025 / Therapy
  5. "Building resilience: How to bounce back from adversity" / Dr. Danny Schwelberg / Jan 8, 2025 / Education
  6. "The benefits of therapy: Finding the right approach for you" / Dr. Danny Schwelberg / Jan 6, 2025 / Active
  7. "Overcoming anxiety: Practical tips for managing worry and fear" / Dr. Danny Schwelberg / Jan 4, 2025 / Active
- Mobile table:
  - "Blog title" header has a select-all **checkbox**.
  - Second column is **"File size"** (200 KB, 720 KB, 16 MB, 4.2 MB, 400 KB, 12 MB, 800 KB). This is a template leftover.
  - Rows are in a different order.
- **No status column** (draft/published), no pagination, no search/sort, no empty state, and no delete confirmation.

**"Resource center" teaser** (the same component as the public blog index):
- Pill "Resource center". H2 "Blogs from our fellow help providers".
- Sub "Guides, insights, and perspectives on mental health — written by fellow mental health providers".
- Button "Blogs" (arrow icon).
- 2×2 cards, each with illustration, category, author, title, "{n} min read · {Mon YYYY}" and a chevron:
  - "Mental health" · "Dr. Danny Schwelberg" · "How to know when you're ready to start therapy — and what to expect" · "8 min read · March 2025"
  - "Guide" · "PsychMind Team" · "CBT vs. psychodynamic therapy: which is right for you?" · "5 min read · Feb 2025"
  - "Wellness" · "Dr. Sara Olisz" · "Five signs that anxiety is affecting your daily life more than you think" · "4 min read · Jan 2025"
  - "Design and Dev" · "PsychMind Team" · "How we designed PsychMind AI search tool in 6 months" · "12 min read · Jan 2025"
  - On mobile all four cards use "Mental health" / "Dr. Danny Schwelberg" / "8 min read · March 2025".

### D4 / D5 — Blog editor

Frames:
- `343:10834` (D, block-editing)
- `343:11285` (D, composed)
- `343:11704` (M, composed)
- `343:12172` (M, empty)

Breadcrumb "Blog › Add new blog › **Draft**" (last item underlined).

**Article meta card:**
- Input placeholder **"Article title"**.
- Meta row: clock icon "Today · April 10, 2026", chat icon "Dr. Sara Oliisi".
- Field **"Choose category"**, placeholder "e.g: Grief & loss". It looks like a free-text input; no dropdown chevron is drawn.

**Content blocks (D4 edit mode).** Each block has a small grey type label above an input box:

| Block label | Content in sample |
|---|---|
| "H2" | "Introduction" |
| "Paragraph" | "Starting therapy can feel like a big step. Many people wait until things feel “serious enough,” while others wonder if their struggles even qualify. The truth is simple: you don’t need to hit a breaking point to benefit from therapy." |
| "Picture" | Dashed dropzone, image icon, "Choose file" + "IMG_5052.png" |
| "Paragraph" | "You don’t need all of these. Even one can be enough.⏎1. You feel stuck in the same patterns⏎ You keep thinking, reacting, or behaving in ways that don’t serve you, even when you try to change.⏎2. Your emotions feel overwhelming⏎ Stress, anxiety, sadness, or anger feel harder to manage than usual.⏎3. It’s affecting your daily life⏎ Sleep, work, relationships, or motivation are starting to suffer.⏎4. You want to understand yourself better⏎ You’re not in crisis, but you’re curious about your thoughts, habits, and past experiences.⏎5. You’ve tried handling it alone⏎ Journaling, talking to friends, or self-help helped a bit, but not enough." |
| "Quote" | Brand-red left rule. Quote "“Therapy isn’t just advice or someone telling you what to do”", attribution "— Author" |

**"Add a block" palette:** chips with "+" icons: **H1 · H2 · H3 · Paragraph · Image · Quote**.

**Composed mode (D5).** Content-item component types in render order:
- Heading lg "Introduction"
- Paragraph
- **Image square 1:1**, with a caption "Image courtesy of Fauxels via Pexels" (link icon, underlined source)
- Paragraph (numbered list)
- **Quote left** "“Therapy isn’t just advice or someone telling you what to do”" / "— Olivia Rhye, Product Designer"
- Paragraph (lorem ipsum, 3 paragraphs)
- Heading md "What to expect in your first session"
- Paragraph with **bullet list**
- Heading md "How therapy actually feels over time"
- Paragraph with bullets
- **Image portrait 3:4**, caption "Image courtesy of Michael Burrows via Pexels"
- Paragraph with bullets
- **Feature text** callout box (Heading "Final thought" plus paragraph)
- The "Add a block" palette remains at the bottom

**Publish settings sidebar** (desktop right column; stacked above content on mobile):
- Title "Publish settings".
- Rows:
  - STATUS = badge **"Draft"**
  - AUTHOR = "Sara Oliisi"
  - DATE = "April 10, 2026"
  - CATEGORY = "Mental health" (label in source is lowercase "category", rendered uppercase)
- Primary **"Publish now"**. Secondary **"Save as a draft"** (file-text icon).

**Empty state (mobile `343:12172` only):** title, category and publish settings are shown, with only the "Add a block" palette and no blocks.

Not designed:
- No inline formatting toolbar (bold, italic, link, list), even though the composed article uses bullets and numbered lists.
- No list, feature-callout or caption block in the palette.
- No cover image, excerpt, read-time, slug/SEO, or preview button.
- No block reordering/deleting.
- No published / scheduled / under-review / rejected status.
- No validation.

---

## 4. Option lists (database enums) — verbatim

Only the values below appear in the provider designs. **Where the file shows a partial list, this is flagged. Do not treat these as complete.**

| Enum | Values in provider designs (verbatim, design order) | Completeness / cross-refs |
|---|---|---|
| account_type | "I am looking for a provider", "I am a provider" | complete (2) |
| session_participants | Individuals, Couples, Families, Groups | 4 shown. Preview "Session types" renders singulars: "Individual · Couples". Patient cards show "Individual one-on-one therapy", "Individual & Group therapy" |
| age_groups | Children, Teens, Adults +18, Seniors | 4 shown. Preview renders "Adults 18+"; patient filter (`150:3859`) uses "Adults". Pick one label |
| specialties | Anxiety, Grief & loss, Burnout, Relationships, Cultural identity, Trauma & PTSD, Groups, Depression, Self-esteem, Life transitions | **Partial.** Custom entries allowed ("Add specialty"). Preview also shows "Relationship issues" (≠ "Relationships"). Patient filter shows Anxiety, Depression, Grief & loss "+14 more"; patient cards show "Thinking Disorders", "Holistic Wellness", "Adolescents". "Groups" is probably a participant type, not a specialty |
| specialty_categories | "Anxiety & mood", "Trauma", "Relationships & identity" | **Partial.** Preview groups specialties under these. Mapping is not defined |
| therapy_approaches | CBT, Mindfulness, DBT, EMDR, Person-centered, Narrative, Attachment-based, Psychodynamic | **Partial.** Custom entries allowed ("Add approach"). Patient filter adds **Humanistic**; patient card shows "Psychodynamic Therapy" |
| languages | English, French, Arabic | **Partial.** Dropdown "Choose a language", full list not drawn. Patient filter shows English, Spanish, French, German |
| session_format (per location) | Online, In-person | complete (2). Aggregated display strings: "In-person & Online", "Online & in-person", "Online & in-person available" |
| banner_style | 12 textured swatches (blue, dark green, light grey, teal, navy-black, slate, emerald, bright blue, pink, violet, mustard, orange) | complete (12). Store as a key, e.g. `banner_01..12` |
| us_state | Free-text "State *" in design. Samples "New York", "Texas, TX", "New York, NY", "Pheonix, AZ" (sic), "Miami, FL 33131" | **No list in file.** Needs the 50 states + DC (+ territories?) select |
| plan | "Base plan · 3 licensed states" ($10 or $39 / month, conflict); "Basic plan" "3 locations free"; "Upgrade plan" "$5 extra per location" | 2 visible + 2 hidden radio slots. "Base plan" vs "Basic plan" naming conflict |
| analytics_range | Last 7 days, Last 30 days, Last 3 months, Custom | complete (4) |
| analytics_metric | Conversion rate, Impressions, Profile views, Session requests, Saves | complete (5) |
| blog_block_type (palette) | H1, H2, H3, Paragraph, Image, Quote | palette (6). The renderer also uses Heading lg/md, Image square 1:1, Image portrait 3:4, Quote left, Feature text, bullet/numbered lists |
| blog_category | Free text "Choose category" (e.g: Grief & loss). Values seen: Mental health, Design, Research and Dev, Therapy, Education, "Active" (leftover), Guide, Wellness, Design and Dev | **Undefined taxonomy.** Needs a decision |
| blog_status | Draft (only one shown); actions "Publish now" / "Save as a draft" | needs Published (+ Unpublished/Under review if moderated) |
| profile_status | "Live" (badge, green dot) | needs pending_verification, rejected/needs_changes, paused_payment, hidden, etc. |
| credential/license type | — (only free-text "Title / credentials", e.g. "Clinical Psychologist, Ph.D.", "Counselor, LMHC, M.S., B.S."; preview LICENSE value "Clinical Psychologist"; patient cards "Psychiatrist, M.D.", "Licensed Professional Counselor, LPC") | **Absent.** No license-type enum (LMHC/LPC/LCSW/LMFT/PsyD/PhD/MD/NP…) |
| fees / sliding scale | — (preview shows "Individual session 120 USD", "Couples session 160 USD"; patient filter "From 120USD To 350USD") | **Absent from onboarding** |
| insurance | — (patient filter has "Accepts Insurance" and "Insurance name") | **Absent from provider flow** |
| provider gender | — (patient filter "Provider gender": Female, Male, Non-binary) | **Absent from provider flow** |
| preferred / primary specialty | — | **Absent** (required by business rules) |

---

## 5. Public-profile data model (what the provider controls → how it renders)

The render is in D2 `339:5155`, PV `314:7594`, the wizard preview panels, and the patient full profile `183:13441`.

**Profile header (left column):**

| # | Data field | Captured where | Render |
|---|---|---|---|
| 1 | banner_style | P1 | Wide textured banner across the top |
| 2 | photo | P2 | Square rounded avatar overlapping the banner (also used small in the sidebar card and dashboard strip) |
| 3 | first_name, last_name | A2 / P1 | "Sara Oliisi" (bold). Business-name mode (A2 checkbox) should replace this, but that **render is not designed** |
| 4 | business_name, display_as_business | A2 | Not rendered in any design |
| 5 | verified flag (system) | admin | "Verified" badge (check-badge) top-right of the name block |
| 6 | title_credentials | P1 | Line under the name with check-badge icon: "Counselor, LMHC, M.S., B.S." |
| 7 | pronouns | P1 | Same line, after title: "she/her" |
| 8 | session formats (derived from locations) | P5 | Chip "Online & in-person" |
| 9 | primary location (city, state, ZIP) | P5 | Chip with map-pin "Miami, FL 33131". **ZIP is not captured anywhere** |
| 10 | response time (system/static?) | — | "Responds within 48h" (clock). **Not captured.** Static or computed? |
| 11 | messaging hint | — | "Message before request" (chat). **Conflicts with no-messaging rule** |

**Body sections (left column):**

| # | Data field | Captured where | Render |
|---|---|---|---|
| 12 | who_you_work_with | P3 | Section "Who I work with": paragraphs, then chips of participants + age groups ("Individuals", "Couples", "Adults 18+") |
| 13 | about | P3 | Section "About {first_name}": paragraphs, truncated with "Read more" |
| 14 | specialties (+ category) | P4b | Section "Specialties": uppercase category subheads, each with chips |
| 15 | license (type, number, verified) | P6 | "Credentials & qualifications" › LICENSE: "Clinical Psychologist" / "Verified by PsychMind · License #MA-2941" / "Claudia Molina Camerota" (unexplained third line: supervisor? issuing body? Placeholder) |
| 16 | education (degree, school, city, year) | **not captured** | EDUCATION: "Ph.D. Clinical Psychology" / "Université Mohammed V, Rabat · 2015" |
| 17 | years_experience | P6 (optional, per state) | EXPERIENCE: "9 years in practice" |
| 18 | languages | P4b | LANGUAGES: "French, English" (comma list) |
| 19 | session participants | P4a | SESSION TYPES: "Individual · Couples" |
| — | therapy_approaches | P4b | **Not rendered anywhere on the profile** (only in patient filters) |
| — | age_groups | P4a | Only mixed into "Who I work with" chips |
| — | practice_name, address, other locations | P5 | **Not rendered.** The helper text promises the address shows for in-person locations |

**Sidebar card (right column, sticky):**

| # | Data field | Captured where | Render |
|---|---|---|---|
| 20 | identity | — | Small avatar + name + title |
| 21 | fees per session type | **not captured** | "INDIVIDUAL SESSION 120 USD", "COUPLES SESSION 160 USD" |
| 22 | formats | P5 | Monitor icon + "Online & in-person available" |
| 23 | CTAs | — | "Request a session" (primary) · ["Send a message", mobile PV only] · "Call provider" (phone icon, **no phone field captured**) · "Save profile" (heart) |
| 24 | trust lines (static) | — | "Your info is never shared" (shield) · "Credentials manually verified" |

In preview context there is also a "Go back to results" pill on the banner (onboarding preview) or "This is a preview" (dashboard).

---

## 6. Analytics spec (summary)

- **Metrics:**
  - Impressions: appearances in search results
  - Profile views
  - Session requests
  - Saves: patient "Save profile"
  - Conversion rate: requests ÷ profile views, per the sample numbers
- Each metric has a delta vs the previous equal period, shown as an absolute number (+250, -12, +2, +0.0) or percentage points (+2.5%).
- **Ranges:** Last 7 days, Last 30 days, Last 3 months, Custom (no date-picker designed). The KPI tiles and the chart have **independent** range selectors.
- **Chart:** one metric at a time (dropdown), drawn as a line with gradient area. Axis labels are dynamic ("Impressions", "Month").
- **Search keywords:** "How patients found you" / "Top search terms": top 5 queries with bar and count.
  - Requires logging patient search queries that led to an impression or view.
  - Copy promises "Search results are updated everyday" (daily batch is acceptable).
- **Recent session requests:** last 4 requests with patient display name (first name + last initial), participant type, format, and relative date, plus a total count. Requests reach providers by email; this list is read-only.
- **Missing:**
  - Empty state for a brand-new provider or one with no data
  - Pending-verification state (analytics before the profile is live)
  - Paused state
  - Loading skeleton, error state
  - Metric definitions/tooltips
  - A "view all requests" page

---

## 7. Blog spec (summary)

- **Fields:** title (text), category (text/select), blocks[], author (auto, provider name with "Dr." prefix in meta), date (auto, "Today · April 10, 2026"), status.
- **Blocks:**
  - H1, H2, H3, Paragraph (multi-line, supports numbered/bulleted text)
  - Image (upload; the composed view shows aspect variants 1:1 and 3:4 and a credit caption with link)
  - Quote (text + attribution)
  - "Feature text" callout appears only in the composed view.
- **Actions:**
  - Publish now
  - Save as a draft
  - Add blog (list)
  - Edit / Delete (list rows)
- **Output:** blogs surface in the public Resource Center and in the "Blogs from our fellow help providers" teaser. Card fields: category, author, title, read time, month/year, cover illustration. **Cover image and read time are not captured in the editor.**
- **Moderation:** **no hints at all.** No review/pending state, no guidelines, and no report/flag affordance. If Brenda must approve posts, this is all new design.

---

## 8. Billing, subscription, payment, notifications, settings, admin

| Area | Present? | What exists |
|---|---|---|
| Plan / price display | Partial | P0 pricing card (**$10 desktop vs $39 mobile**); P5 usage meter; P5b upsell alert; P5c upgrade modal |
| Payment method entry / checkout | **Absent** | — |
| Subscription management (current plan, renew date, invoices, cancel, update card) | **Absent** | Only "Cancel anytime" bullet copy |
| Failed-payment warning ("profile paused in 3 days") | **Absent** | — |
| Paused / hidden-from-search state | **Absent** | Only "Live" badge exists |
| Verification states (submitted, pending, approved, rejected/needs info, license expiring) | **Absent** | Only copy promises "1–2 business days" |
| Notifications (in-app center or email templates) | **Absent** | — |
| Settings page | **Absent** | Nav link "Settings" only |
| Account menu (avatar dropdown: Settings, Billing, Log out) | **Absent** | Avatar pill with chevron only |
| Admin dashboard | **Absent from entire page `108:121`** | Sections are only Landing pages, Legal pages, User Dashboard, Provider Dashboard, Assets. A full-text search for admin/approve/reject/pending/moderation found nothing |

---

## 9. Inconsistencies and content issues to raise with the client (do not silently fix)

1. **Price conflict.** "$10" / month on desktop `284:9738` vs "$39" / month on mobile `314:7360`.
2. **Plan naming.** "Base plan" (P0, P5) vs "Basic plan" (P5c).
3. **Heading variants.** Desktop "Reach people who are ready to start" vs mobile "Reach patients who are ready to start".
4. **Mobile sign-up step 2** (`284:9661`) uses patient copy: "You are one step away from finding your provider." Desktop says "Let's build your professional profile."
5. **Step numbering.**
   - Picture is "Step 2 of 5" on desktop but "Step 1 of 5" on mobile.
   - Two different screens are both "Step 4 of 5".
   - Credentials comes after "Step 5 of 5" as "Final step".
   - The real count is 7 steps.
6. **"clients" vs "patients".** P3/P4a subtitle says "Help clients understand…", P4b says "Help patients understand…".
7. **"Message before request"** (profile header) and **"Send a message"** (mobile PV `314:7594`) contradict the rule that providers never message patients in-app.
8. **"Verified" badge** is shown in the onboarding preview before any verification.
9. **"Go back to results"** button appears in the onboarding preview (patient-context leftover).
10. **Preview specialties.** The "Anxiety & mood" group shows "Individuals, Couples, Adults 18+" (participant/age chips, not specialties).
11. **"Groups"** appears in both Specialties and Session participants.
12. **"Adults +18"** (chip) vs "Adults 18+" (preview) vs "Adults" (patient filter).
13. **"Relationships"** (specialty chip) vs "Relationship issues" (preview).
14. **Typo "Pheonix, AZ"** (should be Phoenix). It appears in P5b and P6, desktop and mobile.
15. **Mobile address placeholder is "she/her"** (`316:8693`); desktop says "Address here".
16. **NPI placeholder** reuses the license example "e.g. SA-2665". A real NPI is 10 digits.
17. **Profile page subtitle** reuses the Analytics subtitle ("Track your performance on PsychMind, and use insights to generate more leads.").
18. **Name mismatches.**
    - Header avatar "Annah Solto" vs profile "Sara Oliisi".
    - Blog list author "Dr. Danny Schwelberg" on "Your blogs" (should be the logged-in provider).
    - Teaser author "Dr. Sara Olisz".
    - License line "Claudia Molina Camerota".
19. **Languages.** Preview LANGUAGES says "French, English, Arabic" in the wizard but "French, English" on the dashboard profile.
20. **Blog table leftovers.**
    - Action column header "Company".
    - Category values "Active".
    - Mobile "File size" column with KB/MB values, and a select-all checkbox.
21. **Mobile blog subtitle** says "written by our experts", desktop says "written by you".
22. **Chart X-axis** shows 12 months (Jan–Dec) while "Last 7 days" is selected.
23. **"Saves" delta "+0.0"** is decimal formatting on a count.
24. **Mobile filled identity** (`314:7910`) shows "Save and continue" disabled although all required fields are filled.
25. **Mobile P5b** still shows "Add another location" at the 3/3 limit. Desktop removes it.
26. **Session format is per location, but the profile shows one aggregate.** The single-location samples say "In-person & Online" while the session-format chips in the form show only "Online" selected.
27. **Provider pages use the patient marketing footer** ("Ready to find help?", "Log in", "Create account").
28. **"Maximum 1600 words."** on bio fields is very long (≈10k characters). Confirm whether this should be characters.
29. **Trailing spaces / missing period** in "…includes up to 3 locations. " and "…your plan already features 3 ". Cosmetic; render as-is or trim.

---

## 10. Gaps — screens and states a real product needs that the file does not show

### Auth and sign-up

- Email verification ("check your inbox") and resend; verified/expired-link states.
- Provider-specific login landing. A shared login exists in `148:189`; post-login routing by role and by onboarding progress is undefined.
- Google OAuth role handling: what happens if a Google user hasn't picked a role.
- Field validation and error states for every form. **No error text exists anywhere in the provider section.** Examples: email taken, weak password, password mismatch, required field empty, invalid file type/size, upload failure.

### Onboarding wizard

- **Preferred/primary specialty** selector (business rule): absent.
- **Fees:** price per session type (Individual, Couples, …), currency, **sliding scale** yes/no and range, free consultation. These are rendered on the profile and filtered by patients, but never captured.
- **Insurance:** accepts insurance yes/no plus insurer list. The patient filter has "Accepts Insurance" / "Insurance name".
- **Provider gender** (patient filter "Provider gender": Female, Male, Non-binary).
- **Education** (degree, institution, city, year): rendered, not captured.
- **License type/credential enum** (LPC, LMHC, LCSW, LMFT, PsyD, PhD, MD, …) separate from the free-text title.
- **Phone number / contact email** for "Call provider" and for email delivery of session requests.
- **ZIP/postal code** (rendered as "Miami, FL 33131") and a structured address for in-person locations.
- **US state select list** (50 + DC). The design uses free text. One license record per state should be tied to it.
- NPI should be captured **once per provider** (it is per person), not per state. License number, issuing body, expiry date and document stay per state. **License expiry date is not captured at all.**
- Picture constraints (types, size, crop/reposition) and banner + photo combo states.
- Custom specialty/approach entry: chip-added state, duplicate handling, and whether custom values go to admin review.
- **Submit-for-review confirmation screen** after the final step, e.g. "Thanks — we're reviewing your credentials (1–2 business days)", plus what the dashboard looks like while pending.
- Save-and-exit / resume-later, autosave indicator, and editing a completed step.
- Where payment happens relative to verification (before or after approval). The flow has no checkout at all.

### Verification lifecycle (provider-facing)

- States: **Pending review**, **Approved/Live** (only "Live" badge exists), **Rejected / needs more info** (with admin reason and a re-upload path), **License expired / expiring soon**, **Suspended**.
- Emails for each transition (submitted, approved, rejected, expiring).

### Billing and subscription (provider-facing)

- Checkout / payment-method entry (Stripe Checkout or Elements), and the success/failure result.
- **Billing page:**
  - Current plan, monthly price, included and additional locations, next charge date
  - Payment method (update card)
  - Invoices/receipts
  - Cancel subscription and reactivate
- **Failed-payment banner:** "your profile will be paused in 3 days", with a retry/update-card CTA. Shown on all dashboard pages and sent by email.
- **Paused state:** hidden from search, dashboard banner, analytics frozen; reactivation after payment.
- Upgrade confirmation (proration, new total) and downgrade/removing locations above the plan limit.

### Dashboard

- **Profile editor inside the dashboard.** "Edit profile" has no destination. Either re-enter the wizard in edit mode (reuse wizard screens and preview) or design an editor. Also: do edits to verified fields (license, states) trigger re-verification?
- **Settings page:**
  - Name/email/password change
  - Notification preferences (session-request emails, marketing)
  - Business-name display toggle
  - Account deletion / data export
  - Log out
- Avatar dropdown menu contents.
- Active nav-tab state.
- Provider-appropriate footer.
- Analytics:
  - Empty state (new or pending provider)
  - Loading skeleton, error state
  - Custom date-range picker
  - Metric definitions/tooltips
- **Session requests list/detail** ("24 total" has no destination). Even if requests arrive by email, providers likely need a log: patient name, contact, requested format/type, note, date, status (new/contacted/archived?). Note that the patient-side "My bookings" shows "Pending answer" (`253:857`), which implies a provider response state that the provider side never sets.
- Email template designs (session request to provider, verification outcome, payment failure, paused, reactivated). None exist.

### Blog

- Status column and filters (Draft / Published / Under review / Rejected) in the list.
- Empty list state, pagination.
- Delete confirmation, unpublish.
- Editor:
  - Inline formatting (bold, italic, link)
  - Bullet/numbered list blocks
  - Feature-callout block
  - Image caption/credit input
  - Block reorder/delete
- Cover image, excerpt, read time (auto-computed?), slug/SEO meta, preview-as-public.
- Blog category taxonomy (currently free text plus inconsistent sample values).
- Moderation flow if the admin must approve provider posts: submitted / approved / rejected states and reason.

### Admin (Brenda): entirely undesigned

- Admin login / role.
- **Verification queue:**
  - List of pending providers
  - Detail view with the profile, per-state license data, and a document viewer (PDF/JPG/PNG)
  - NPI lookup
  - **Approve / Reject (reason) / Request more info** actions
- Provider management: search, view, suspend/unhide, see subscription status (active, past_due, paused, cancelled).
- Blog moderation (if applicable).
- Taxonomy management (specialties, approaches, languages, blog categories, custom-value review).
- Patient/session-request oversight and support tools; audit log.

### Global

- 404 / 500 pages.
- Session-expired / logged-out redirect.
- Cookie consent banner: the legal copy describes one, but I did not see it in any audited frame. A full-page frame search was not done for it.

---

## 11. Reference IDs and screenshots

- Section screenshot of `255:1412` and local crops: `C:\Users\HomePC\Desktop\Psychmind\figma\screenshots\` (`s4_top.png`, `s4_mid_left.png`, `s4_mid_right.png`, `s4_bot_left.png`, `s4_bot_right.png`, `section-4-hires.png`).
- **Key container IDs:**
  - Access `255:1413`
  - Provider creator `255:1539`
  - Dashboard `337:2210`
- **Key component instances:**
  - Badge (chips): `Size=lg, Type=Badge modern, Color=Gray`. Selected state is expressed via fill override `#292524`.
  - "Line and bar chart" (`Chart style=Line`, `_X-axis Data=12 months`).
  - "Table" (`Example=Files`).
  - "Content item" (Type = Heading / Paragraph / Image square 1:1 / Image portrait 3:4 / Quote left / Feature text).
  - "Radio group item" (`Type=Icon simple`) with `_Checkbox base`.
  - "Featured icon" (info-circle, star, credit-card-refresh).
- Patient-side frames referenced for cross-checks:
  - Search results with filters `150:3859`
  - Patient full profile `183:13441`
  - My bookings `253:857`
  - Shared login/reset `148:189`
- `PROJECT_OVERVIEW.md` corrections:
  - The provider onboarding has **no "identity verification (document upload)" step at the start** and **no map**.
  - Document upload happens only in the final Credentials step (per licensed state).
  - Locations are typed fields, not a map.
  - The "Public profile" dashboard page is a **preview only**, not an editor.
