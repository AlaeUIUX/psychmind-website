# PsychMind app portal: auth screens design brief

**Purpose:** Inspiration research and a build-ready direction for the account-flow screens on the app subdomain:
- role choice
- create account (patient and provider)
- log in
- check your email / verification
- forgot password, reset link sent, set new password

**Date:** 2026-10-08
**Sources:**
- shadcn/ui v4 `login-01…05` and `signup-01…05`. I read the source on GitHub (`apps/v4/registry/new-york-v4/blocks/*`), because the block pages only show the wrappers.
- Mobbin MCP, platform `web`: 13 screen searches. I looked at every image before citing it.
- The existing Figma audits, `figma-patient-auth.md` and `figma-provider.md`.
- A read of the current working tree: `src/app/(auth)/*`, `src/components/auth/*` and `globals.css`.

**Not in scope:** onboarding wizard, dashboards, marketing pages.

> **Content rule:** All Figma copy is client-approved and is kept verbatim below.
> - New microcopy is marked **(new copy, TODO(client))**.
> - Where possible, this brief reuses strings that are already approved (Figma trust lines, helpers) instead of inventing new ones.

> **Status:** On 2026-10-08 the working tree already has a first cut of a persistent portal layout: `(auth)/layout.tsx`, `template.tsx`, `portal-panel.tsx`, `fields.tsx` and the `.app-ui` / `type-ui-*` roles in `globals.css`.
> - It is close to the recommended concept in §4.
> - §4 can serve as the acceptance spec for it.
> - §6 lists the places where it currently drifts from copy, privacy or mobile rules.

---

## 0. TL;DR

- **Recommended concept:** **"Living portal"** (Concept B in §3), with Concept A's ambience underneath.
  - **Layout:** a calm Geist form column on the left and a persistent panel on the right.
  - **Panel base:** warm ink `warm-950`, with paper grain, two slow crimson and blush glows, and an 8 s "breathing" ring.
  - **Panel foreground:** step-aware product scenes.
  - **Highlight scene:** on provider sign-up, the panel shows the provider's **own profile card filling in as they type**, which makes the Figma rule "Your full name will not show, and your profile will feature the business name" visible.
  - **Continuity:** the panel never remounts between auth routes, so the whole flow feels like one app.
- **Top 5 ideas:**
  1. Live profile preview for providers.
  2. A role card that previews its side of the product on hover or focus.
  3. Auto-continue when the email is verified in another tab, plus an "Open Gmail"/"Open Outlook" button that matches the address's domain.
  4. A top-anchored form column with direction-aware transitions, so screens don't jump.
  5. A "last used: Google/email" hint, storing the **method only, never the email** (a privacy-first take on Linear's pattern).

---

## 1. shadcn/ui blocks: layouts and what to reuse

The v4 registry has **only** `login-01…05`, `signup-01…05`, `sidebar-*` and `dashboard-01`. **There are no OTP or verification blocks**, so build that screen from the `input-otp` primitive plus `Field`. Every block splits into `page.tsx` (layout wrapper) and `components/*-form.tsx` (the form).

### 1.1 Block by block

| Block | Layout | Form details | Side panel | Reusable for us |
|---|---|---|---|---|
| **login-01** | Centered `max-w-sm` on `min-h-svh`, `p-6 md:p-10` | `Card` with a title and description. `Email` (placeholder `m@example.com`). `Password` with **"Forgot your password?" right-aligned in the label row** (`ml-auto`). `Login` button, then an outline "Login with Google" stacked below. "Don't have an account? Sign up" | none | Label-row "Forgot" link (Figma A3 uses the same placement) |
| **login-02** | **Split page** `grid min-h-svh lg:grid-cols-2`. Left column has a logo row at top left (`size-6` primary square plus name), then a form `max-w-xs` centered in `flex-1` | Centered `h1 text-2xl font-bold` with a muted subtitle. Fields, then `Login`, then `FieldSeparator` "Or continue with", then GitHub outline, then the sign-up line | `bg-muted` cover image, hidden below `lg`, `dark:brightness-[0.2] dark:grayscale` | **The page skeleton we want:** logo row on top, form vertically free, panel from `lg` up |
| **login-03** | `bg-muted` page, logo centered above a card | Card header centered "Welcome back". **Social first** (Apple and Google full width), then the separator, then email and password. **Legal line below the card** (`FieldDescription px-6 text-center`) | none | `FieldSeparator` on a card needs `*:data-[slot=field-separator-content]:bg-card`. The legal line sits below the card |
| **login-04** | `bg-muted` page. `Card overflow-hidden p-0` with `CardContent grid md:grid-cols-2`; the form is `p-6 md:p-8` | Same fields. **Three icon-only social buttons** (`grid-cols-3`, `sr-only` labels). Legal line below the card | Image `absolute inset-0 object-cover` in the right half of the card | This is exactly the old Figma and `AuthShell`: a card with a static photo. **Don't** keep it |
| **login-05** | Centered `max-w-sm` | **Email only** (magic link). Icon logo, `h1 text-xl` "Welcome to…", the sign-up link sits **in the header** under the title. `Login`, then "Or", then Apple/Google in `sm:grid-cols-2`. Legal line below | none | The pattern for a future magic-link login (BUILD-PLAN D6 plans magic link) |
| **signup-01** | Centered card | `Full Name`. `Email` with description ("We'll use this to contact you…"). `Password` with "Must be at least 8 characters long." `Confirm Password` with its own helper. `Create Account` plus outline "Sign up with Google". "Already have an account? Sign in" | none | Helper text under each field |
| **signup-02** | Split page like login-02 | Centered heading, same fields, then a separator, then GitHub | Image | The skeleton again |
| **signup-03** | `bg-muted`, card, centered header | Name and email, then **Password and Confirm side by side** (`grid grid-cols-2 gap-4`) with **one shared helper below the pair** ("Must be at least 8 characters long.") | none | **Matches Figma A2 exactly:** a half-width password pair with one helper |
| **signup-04** | Card split, `md:max-w-4xl` | Email with description, the side-by-side password pair, three icon socials, legal below | Image in the card | Avoid, for the same reason as login-04 |
| **signup-05** | Centered `max-w-sm` | Email only, then `Create Account`, then "Or", then two social buttons | none | A low-friction variant for later |

### 1.2 Primitives worth reusing (from `ui/field.tsx`, `input.tsx`, `button.tsx`, `input-otp.tsx`)

- **`FieldGroup`:**
  - The default gap between fields is `gap-7` (28 px); a nested `FieldGroup` uses `gap-4`.
  - For a product-dense portal, **override to 16 px between fields and 24 px between groups** (§4.4).
- **`Field`:**
  - Has `orientation` set to `vertical`, `horizontal` or `responsive`. `data-invalid=true` tints the label and description.
  - `FieldError` renders `role="alert"`, `text-destructive`, and accepts an array of errors.
- **Choice card pattern:**
  - A `FieldLabel` that wraps a `Field` becomes a bordered, rounded, `p-4` card (`has-[>[data-slot=field]]:rounded-md border`).
  - Put a `RadioGroupItem` inside it and you have the role-choice card, with real radio semantics and arrow-key navigation, without hand-rolling anything.
  - Pair it with `FieldSet` and `FieldLegend` so the Figma group label "Choose account type" becomes a real `<legend>`.
- **`FieldSeparator`:** a centered label on a rule. On a card, set the label background to the card colour (see the trick in §1.1).
- **`Input`:**
  - Stock is `h-9 rounded-md`, with **`text-base md:text-sm`** (16 px on phones prevents iOS Safari's zoom-on-focus).
  - Focus is `ring-[3px] ring-ring/50`; `aria-invalid` gives a destructive border and ring.
  - PsychMind's own `Input` is `h-11 rounded-field`; `.app-ui` sets `--radius-field: 8px`.
- **`Button`:** stock sizes are `default h-9` and `lg h-10`. PsychMind's sizes are `default h-10`, `sm h-9` and `md h-11`.
- **`InputOTP`:**
  - Components: `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator`, with a blinking fake caret.
  - Use it with `pattern={REGEXP_ONLY_DIGITS}` and `autoComplete="one-time-code"`.
  - Only needed if a code is added alongside the link (see §5).

### 1.3 What not to take from the blocks

- Icon-only social grids. We have one provider (Google), so use a full-width labelled button. Icon-only also hurts recognition and accessibility.
- `font-bold text-2xl` headings. In the portal, the title role is `type-ui-title`, 600 weight.
- The `bg-muted` + card + photo frame. The owner explicitly wants no static image.

---

## 2. Mobbin references: the 15 best

| # | Reference | What to steal |
|---|---|---|
| 1 | [Rox, welcome form with personalised preview](https://mobbin.com/screens/f36fd12b-11f5-48aa-8bfb-1f094e8aa064) | A warm beige panel with one floating product card ("Morning, ___") whose blurred content waits for **your** name. This is the seed of our live provider card |
| 2 | [Asana, "What do you want to do first?"](https://mobbin.com/screens/0f38bd61-648e-4822-bf8a-03478af290b4) | Choice cards on the left and a large product preview on the right that **reflects the highlighted choice**. Our role cards should swap the panel scene (patient search vs provider profile) |
| 3 | [Perplexity Health, get started](https://mobbin.com/screens/0445139c-5f22-4c26-93a6-2c537453485f) | The closest tonal match: a warm paper left half, a **serif headline**, three icon-led privacy promises, and the product UI bleeding off the edge of a deep tinted panel. Proof that "health-grade trust" and "product polish" can share a screen |
| 4 | [Lindy, sign up](https://mobbin.com/screens/a2fe5df1-faad-4883-abaf-a02010c45846) | An **inset** rounded panel (page margin all round) with a warm gradient and a tilted, low-detail product wireframe. The framing reads premium without a photo |
| 5 | [Adaline, create account](https://mobbin.com/screens/2a5883b7-dd75-4601-b1e8-56ef180c2d46) | "Ghost UI": a greyscale skeleton of the app on a dotted construction grid, with a logo strip below. It never goes stale and never shows fake data, which makes it a good fallback scene for log in |
| 6 | [Origin, create account](https://mobbin.com/screens/7214bacd-71fe-4cd8-b221-038b5da24631) | Serif statement on the panel, a laurel social-proof badge and a glass data card. On the form: a **5-segment strength bar with a "Strong" label and a live rule checklist** |
| 7 | [Stripe, create account](https://mobbin.com/screens/659402fd-e641-4535-9899-8d229e8aad96) | Faint vertical column guides behind the layout (a structural, "engineered" texture), value props with thin accent rules, and a 3-segment strength bar with a label. Also [Stripe sign in](https://mobbin.com/screens/46b46f0f-6cb5-4f1e-85a3-bb0606894379): a **card footer band** for the "New to…? Create account" switch |
| 8 | [Stripe, 6-digit code](https://mobbin.com/screens/986ec6f2-e1fd-44a0-b8a2-bdd48a4f0089) | A 3–3 split code, **auto-submit with a spinner** on the 6th digit, and "Resend (8)" with the countdown inline in the sentence. The model for any code entry |
| 9 | [Linear, log in](https://mobbin.com/screens/3997d60f-bea7-4068-af79-3942a664072e) | The line "You used email to log in last time" under the primary method. Also [Linear check email](https://mobbin.com/screens/da6825c0-a150-48bb-af3a-6a0f3ea08bb1): logo, title, the email in bold, one field, one button, "Back to login". Nothing else |
| 10 | [Vercel, log in](https://mobbin.com/screens/e839e5dd-ca34-4876-863e-f816ff2757d8) | The only chrome is the logo at top left and the **Sign Up / Log In swap at top right**. A narrow column, Terms and Privacy as a quiet footer. [Vercel sign up](https://mobbin.com/screens/3f956cd6-f688-4dd3-a6ac-5908c7cba500) adds a one-line social proof under the card |
| 11 | [Gemini, check your email](https://mobbin.com/screens/a4243138-baa3-47b9-93cd-11157794c1e2) | A **hand-drawn paper plane with sparkles** (our doodle language exactly; Figma A5 also uses a paper plane). "Request a new email in **28** seconds", and a left **vertical step rail** (Create account ✓, Activate account) |
| 12 | [Navan, check your inbox](https://mobbin.com/screens/f82615a8-e4b8-48a6-99a2-33a7f52396c3) | **Open Gmail / Open Outlook** buttons, a live "link expires in 14:59", and a quiet "Resend email". The panel keeps telling the product story while the user waits |
| 13 | [Nextdoor, reset email sent](https://mobbin.com/screens/9a7c9249-f970-4381-a092-a57079fa2993) | **Privacy-safe** wording ("If you have an account…") and a resend row with the seconds counter right-aligned in the card footer. Pair with [Slack, reset link sent](https://mobbin.com/screens/88b4a62c-1cad-4db2-bae0-95dcc76e7bba) for "Wrong email address? Re-enter" |
| 14 | [Chatbase, change password](https://mobbin.com/screens/e1163660-4fe6-49fd-9058-97c2a054a705) | The cleanest strength UI: label on the left, segmented bar on the right, and a two-column checklist that turns green rule by rule |
| 15 | [Headspace, sign up in the care flow](https://mobbin.com/screens/ad131985-8bef-4094-83d6-ea0478653a79) | Account creation framed as **one step in the user's own journey** (a top stepper: Check In ✓, Verify Insurance ✓, then Schedule appointment), with warm illustration. Our `?next=` request flow should show the same journey context |

**Also useful (seen, smaller lessons):**
- [User Interviews](https://mobbin.com/screens/23f04314-660c-422b-9083-761153c2a654): "We'll see you back here in 10 seconds", meaning the page auto-continues once you verify.
- [Wise](https://mobbin.com/screens/efb34824-14cc-45b0-a065-44f1976c8a35): a disabled "Resend email 0:59" pill.
- [Laravel Cloud](https://mobbin.com/screens/1b53771e-bc21-4e8d-a6ee-fee47d13045b): the email field **locks** (greyed) once you move on to the password.
- [Mercury log in](https://mobbin.com/screens/95e22d1e-0d70-469b-b7c7-58090c5da404): a contextual panel inside the login card, and an attached eye toggle.
- [Preply](https://mobbin.com/screens/fc0cedbb-a5e7-41ce-b0d4-6db5a54dc0e6): a marketplace collage of real-looking people cards, and an inline "email already exists" error.
- [Airbnb](https://mobbin.com/screens/bc41f82c-1bdb-45d0-bfd2-6437581b2633): first and last name in one bordered group.
- [Airbnb success](https://mobbin.com/screens/191dd2ad-4fbb-4bf5-824d-af1435393c72): a single check mark on "You're all set!".
- [Kraken](https://mobbin.com/screens/78988fbe-f7ab-4233-a935-70fb1be58248): a "don't reuse a previous password" callout.
- [Typeform](https://mobbin.com/screens/c3322476-0017-4908-9642-b2539a449756): a tiny interactive product moment on the panel.
- [Gorgias](https://mobbin.com/screens/30949071-182f-4b67-92b0-73ae063d4f11): a preview that reacts to the selected option, and a floating step pill.
- [Modal](https://mobbin.com/screens/56058109-b4ea-4a30-80ca-90f6ec99f6a7) and [Emergent](https://mobbin.com/screens/dcf2f029-c756-4701-aac9-234ef98552b9): carousel panels with dash indicators. **Anti-pattern for us:** rotation distracts on a form.
- [Deel](https://mobbin.com/screens/c3f6d824-8703-4563-8d11-0b4b80d23f8a): a "Can't find your email?" help card pinned low on the page.
- [Sprig](https://mobbin.com/screens/ee66e79e-1775-40e5-9f2b-440593785b71): a line-drawn paper plane on "reset sent".

**Not searched individually:** Notion, Arc, Raycast, Ramp and Calm, to stay within the search budget. Their auth patterns (minimal centered column, method-first buttons, quiet chrome) are covered by Linear, Vercel and Mercury above. Run one more pass if a specific app matters.

---

**Your Mobbin AI usage is high this month**

Usage is unlimited during beta. If your usage stays at this level, you may need to purchase more credits once limits take effect. [View usage and plan options](https://mobbin.com/settings/billing-and-usage)

---

## 3. Three layout concepts

All three share the same form column (§4). They differ in what replaces the photo.

### Concept A: "Brand canvas" (ambient, editorial)

```
┌───────────────────────────┬──────────────────────────────────────┐
│ ◐ PsychMind     Sign in → │ ░░ warm ink + paper grain ░░░░░░░░░░ │
│                           │        ( breathing ring, 8 s )       │
│ Step 1 of 2               │    crimson + blush glows drifting    │
│ Who are you joining as?   │                                      │
│ [ card ]                  │   ✎ doodle that draws on per step    │
│ [ card ]                  │                                      │
│ [ Continue ]              │  "Serif quote from an approved       │
│                           │   testimonial"        — Name, role   │
│ Terms · Privacy · 988     │   ● ○ ○  (rotates slowly, pausable)  │
└───────────────────────────┴──────────────────────────────────────┘
```

**What it is:**
- A warm-ink panel with grain, slow glows and a breathing ring (a calm, mental-health-appropriate rhythm).
- A doodle per step: arrow, magnifier, paper plane, key, check.
- One Ivar serif line: an **approved** testimonial or trust statement.

**Pros:**
- On brand with the marketing site's dark grain bands and doodles.
- Cheap to build.
- No data to fake.
- Can't go stale.
- The calmest option, which suits the audience.

**Cons:**
- Decorative only; it says nothing about the product.
- Glow and gradient panels are everywhere right now and can read as generic without the doodles.
- Testimonials must be real and client-approved (FTC endorsement rules); invented ones are a no-go on a health site.
- Rotation competes with the form.

### Concept B: "Living portal" (step-aware product scenes) — recommended

```
┌───────────────────────────┬──────────────────────────────────────┐
│ ◐ PsychMind     Sign in → │ ░ same ambient canvas as A ░░░░░░░░░ │
│                           │   ┌──────────────────────────────┐   │
│ Step 2 of 2               │   │ (JD)  ThinkWell Therapy Ctr  │   │
│ Create your account       │   │ ◌ Verification pending       │   │
│ First [Jane] Last [Doe]   │   │ ▭▭▭▭▭  ▭▭▭  ▭▭▭▭             │   │
│ Business name [ThinkWe|]  │   └──────────────────────────────┘   │
│ ☑ Enlist with business…   │   ✓ Your info is never shared        │
│ Email / Password ▮▮▮▯     │   ✓ Credentials manually verified    │
│ [ Create Account ]        │                                      │
│ ── Or continue with ──    │   Serif caption (approved line)      │
│ [ G  Continue with Google]│                                      │
└───────────────────────────┴──────────────────────────────────────┘
```

**What it is:** the same ambient layer as A, plus a foreground "scene" that mirrors where the user is (scene table in §4.2):
- Role choice previews each side of the product.
- Provider sign-up shows **their** profile card building itself.
- Patient sign-up shows a search with verified provider cards.
- Verify shows an inbox card addressed to the email they typed.
- Reset shows a key and lock.
- Scenes reuse `components/shared/product-preview.tsx`, `VerifiedBadge`, `providerPhoto()` and the doodles.

**Pros:**
- Explains the value at the moment of commitment.
- Makes the Figma business-name rule tangible.
- Pre-echoes the onboarding wizard, which already has a live profile preview in Figma (P1–P5), so sign-up flows straight into onboarding.
- Strongly differentiated from template auth pages.
- The trust chips use **already-approved** strings.

**Cons:**
- The most build effort: six scenes, plus edge cases such as long names, an empty state, and RTL or emoji in names.
- Must never show health data and must be `aria-hidden`.
- Must stay quiet on log in, where returning users don't need selling.
- Needs a performance budget: CSS only, no GSAP and no video.

### Concept C: "Single column + journey rail" (Linear/Vercel minimal)

```
┌──────────────────────────────────────────────────────────────────┐
│ ◐ PsychMind                                         Sign in →    │
│                 ● Account ─── ○ Email ─── ○ Profile              │
│                          ✎ (small doodle)                        │
│                     Create your account                          │
│                     [ 384 px form column ]                       │
│            Terms · Privacy · 988 · "Credentials manually         │
│                         verified" chip                           │
└──────────────────────────────────────────────────────────────────┘
```

**What it is:** a centered 384 px column on a warm-25 paper ground. There is no panel. A slim journey rail (Account, then Email, then Profile) and a 48 px doodle above each title carry the brand.

**Pros:**
- Fastest to build.
- Most robust.
- Identical on desktop and mobile.
- Maximum focus.
- Zero fake data.

**Cons:**
- Doesn't answer the owner's "portal" brief.
- Looks empty at 1440 px.
- Loses the chance to sell the provider side.
- The journey rail adds labels that are new copy.

**Verdict:** Use **B on top of A's ambience**. Use **C's behaviour on screens under 1024 px**, where the panel is hidden.

---

## 4. Recommended concept: specs

### 4.1 Grid and layout

| Breakpoint | Structure |
|---|---|
| **≥ 1280** | Page padding 12 px (`lg:p-3`). **Form pane 560 px** fixed. **Panel** fills the rest (≈ 856 px at 1440), inset with `rounded-2xl` (16 px) and its own subtle inner border `ring-1 ring-white/5` |
| **1024–1279** | Form pane `min(560px, 46%)`; panel as above |
| **640–1023** | No panel. Single column, centered, white ground |
| **< 640** | No panel. 16 px side gutter (`px-4`), 20 px from `sm` |

**Form pane anatomy:**
- **Header:** 64 px tall (56 px on phones). Logo glyph 26 px with the wordmark on the left; the swap link on the right.
- **Main column:** `max-w-sm` (384 px).
- **Footer:** a 12 px caption row containing the Figma legal sentence on screens that have a submit, plus "Terms · Privacy", ©, and **988** (see §6).

**Top-anchor the column; don't centre it vertically:**
- Put the column's top at `clamp(40px, 14vh, 140px)` below the header.
- Centring makes the title jump up and down as screens change length. Anchoring keeps the H1 on the same baseline across all seven screens, which is a large part of the "one app" feel.

### 4.2 Panel scenes

The panel persists in `(auth)/layout.tsx`, and the scene is derived from `usePathname()`.

| Route | Scene (foreground) | Text on panel |
|---|---|---|
| `/login` | **Quiet.** The ambient layer plus a ghost-UI silhouette of the patient dashboard (Adaline-style skeleton): saved provider row, request row with the Figma status chip "Pending answer", no names | One approved serif line, or none |
| `/signup` (role) | **Split preview.** Default: two small stacked cards, a patient search card and a provider profile card. **Hovering, focusing or selecting a role card** cross-fades to that side's scene (Asana pattern) | Trust chips: `Your info is never shared`, `Credentials manually verified` (approved Figma strings) |
| `/signup/patient` | Search preview: 3 provider result cards (photo, name, credential line, "Verified" badge), using `SearchPreview` from `product-preview.tsx` | Same trust chips |
| `/signup/provider` | **Live profile card.** See the details below this table | Same trust chips |
| `/verify-email` | Inbox card: from PsychMind, to *the email they just entered* (taken from client state, **not the URL**). An envelope doodle draws on. On verify: the check doodle draws plus a ring pulse (the one GSAP "celebration" moment) | — |
| `/forgot-password`, `…/sent` | Key doodle. On "sent", the **paper plane** (Figma A5 motif) flies a short arc and settles | — |
| `/reset-password` | Lock, then unlock on success | — |

**Live profile card on `/signup/provider`:**
- The avatar shows initials from First and Last name and is crimson-tinted while empty.
- The display name is *First Last*. **When "Enlist with business name" is checked and Business name has a value, the display name morphs to the business name**, and the personal name collapses to nothing (a 200 ms crossfade).
- The `VerifiedBadge` shows in a dotted, pending style.
- Skeleton bars stand in for specialties and fees; they hint at what onboarding will fill in.

**Panel rules:**
- `aria-hidden`.
- No real patient data.
- Empty values show tasteful placeholders, not "undefined".
- Names truncate with an ellipsis at 2 lines.
- Pointer parallax of 10 px or less on cards.
- Pause all ambient animation when `document.hidden` or under `prefers-reduced-motion`.
- Panel captions are **(new copy, TODO(client))**. Default to the approved trust strings and the Figma subtitles.

**Ambient colours (existing tokens only):**
- Base `warm-950` (#171412) with the `.grain` overlay.
- Glow 1: `brand-primary` at 14–18 % in a radial fade.
- Glow 2: `tape-rose` at 8–10 %.
- Ring: `white/6` stroke.
- Cards: white with `shadow-raised`.
- Drift cycles of 18 s and 22 s.
- Ring breath of ~7.8 s, roughly one slow breath (already in `globals.css`).

### 4.3 Type (Geist via `.app-ui`, `font-feature-settings: "cv11","ss01"`)

| Role | Utility | Size / line-height | Weight | Tracking | Used for |
|---|---|---|---|---|---|
| Screen title (H1) | `type-ui-title` | 22 / 28 | 600 | −0.024em | Every H1 ("Who are you joining as?", "Log in to PsychMind"…) |
| Success display | `type-ui-display` | 28/34 → 34/40 | 600 | −0.032em | Only the verified and password-updated moments |
| Card title | `type-ui-heading` | 15 / 22 | 600 | −0.012em | Role card titles |
| Body | `type-ui-body` | 14 / 21 | 400 | 0 | Subtitles under the H1, info text |
| Label | `type-ui-label` | 13 / 18 | 500 | 0 | Field labels, the step label, the top-right swap link, button-adjacent links |
| Small | `type-ui-small` | 13 / 18 | 400 | 0 | Role card descriptions, **field errors** (errors get 13, not 12, for legibility) |
| Caption | `type-ui-caption` | 12 / 16 | 400 | 0 | Hints, "Optional", the legal line, footer |
| Mono | `type-ui-mono` | 12.5 / 18, tabular | 400 | −0.01em | Countdowns ("0:42"), codes, so digits don't jitter |
| Panel caption | `type-h4` (Ivar) | 22/30 → 24/32 | 400 | −0.01em | **The only serif in the portal**, on the panel only, as the bridge to marketing |

**Other text sizes:**
- **Input value text:** 16 px under `md` and 14 px from `md` (`text-base md:text-sm`). See §6, item 1.
- **Button labels:** 14/20, weight 500.

### 4.4 Spacing rhythm (4 px grid)

| Between… | Space |
|---|---|
| Step label and H1 | 8 px |
| H1 and subtitle | 8 px |
| Header block and first field | 28 px |
| Label, control and hint/error (within a field) | 6 px each |
| Fields | **16 px** |
| Field groups (for example, the name row and the email/password block) | 24 px |
| Last field and primary button | 24 px |
| Primary button and separator | 20 px, and 20 px again from the separator to the Google button |
| Google button and the "Already have an account?" line | 20 px |
| Half-width field pairs (First/Last, Password/Confirm) | 12 px gap; they stack under 380 px of available width |

### 4.5 Controls

**Input:**
- Height 40 px (`h-10`), or 44 px under 640 px.
- Radius 8 px (`.app-ui` `--radius-field`). Padding `px-3`.
- Border `warm-300/80`, white background, no shadow.
- Hover: border `warm-300`.
- **Focus:** border `brand-primary/60` plus a 3 px ring at `brand-primary/15`.
- Invalid: border `red-600/70` plus a ring at `red-600/12`.
- **Locked carry-over email** (verify and reset screens): `warm-50` background, `warm-600` text, and a trailing ghost "Edit" link (Laravel Cloud pattern; "Edit" is new copy).

**Password:**
- A 32 px ghost icon button inset 4 px from the right, with `aria-pressed` and an `aria-label` that toggles between show and hide.
- The field keeps the caret position when toggling. It re-masks automatically on submit.

**Primary button:**
- Ink `warm-900` (hover `warm-800`), height 40 px (44 px on phones), radius 8, full width, label 14/500.
- Press: `active:scale-[0.98]` over 100 ms.
- Focus: a crimson 3 px ring at 30 %.
- **Crimson (`brand`) buttons are not used on auth.** They are reserved for the single most important action in-app.

**Google button:**
- Outline variant, white with a `warm-200` border; hover `warm-50`.
- Full-colour 16 px "G" plus a visible label. The Figma shows the logo only, so the label "Continue with Google" is **(new copy, TODO(client))**. At minimum, give it an `sr-only` label.

**Role cards** (`FieldSet` > `FieldLegend` "Choose account type" > `RadioGroup` > `FieldLabel` choice cards):
- **Size and layout:** minimum height 76 px, padding 16, gap 12, radius 12, border `warm-200`. Cards are stacked.
- **Content:** a 36 px icon tile (radius 8, `warm-100`, icon `warm-700`). Title `type-ui-heading`, description `type-ui-small warm-600`. A 16 px radio at top right.
- **Hover:** border `warm-300`.
- **Selected:** border `brand-primary`, `ring-[3px] ring-brand-primary/10`, background `brand-soft/50`, icon tile white with a crimson icon. Colour transitions take 150 ms.
- **Behaviour:**
  - Arrow keys move the selection.
  - Double-click or Enter on a card submits.
  - Selection also drives the panel scene (§4.2).
- **Copy:** use the Figma strings verbatim, `I am looking for a provider` and `I am a mental health provider`. Note that the provider frame says `I am a provider`; the client must pick one.

**"Enlist with business name"** (provider):
- Same card language as the role cards, but with a checkbox.
- Reveal it (200 ms height and opacity) once Business name has a value, so the optional path doesn't clutter the default.
- Title and helper are the Figma strings verbatim.

**Step label:**
- The Figma `Step 1 of 2`, with the current number in `warm-900` and the rest in `warm-500`.
- Optionally, two 24×3 px dashes, with the current one crimson. Put this **in the layout**, so the fill animates from 1 to 2 instead of re-mounting.

**Form-level banner:**
- Radius 8, padding 12, 13 px text, 16 px icon.
- Variants: danger (`red-50` background, `red-200` border, `red-800` text), info (sky) and success (emerald), following the `StatusBanner`/`Badge` palette.

### 4.6 Colour budget

Crimson appears in exactly four places:
1. Focus rings.
2. The selected role or checkbox card.
3. The current step dash.
4. The panel glow.

Everything else is ink and warm greys. **Errors use `red-600`/`red-700` with an icon, never crimson.** `#c01048` and error red are close enough that a crimson error would read as "brand", and a crimson brand detail would read as "error".

### 4.7 States

| State | Treatment |
|---|---|
| Field invalid | Validate **on blur**, then live on change once a field has errored ("reward early, punish late"). Red border and ring. A 13 px message with a 14 px `CircleAlert` icon appears below, revealing with height and opacity over 150 ms. Set `aria-invalid` and `aria-describedby`. On submit, focus the first invalid field and scroll it into view with a 24 px margin. **No shake animation**; it's jarring for an anxious audience |
| Form-level error (wrong credentials, rate limit, Google failed or cancelled, email already registered) | Banner at the top of the form with `role="alert"`, and focus moves to it (`tabIndex={-1}`). **Privacy-safe wording:** login never says which part was wrong; forgot password always shows the same result |
| Loading | Wrap the form in `<fieldset disabled>` to prevent double submits, without greying the inputs. The button shows a 16 px spinner before the label, at the same width so the layout doesn't shift. Keep the spinner up for at least 300 ms to avoid a flash. Google redirect: spinner on that button only |
| Success: account created | Route to verify. The panel's profile card (provider) or search card (patient) slides into the inbox scene's envelope (a shared-element morph, §4.9) |
| Success: email verified | The one celebration: a GSAP doodle check draws over 600 ms, a ring pulse, and the H1 in `type-ui-display`. Auto-continue after ~1.2 s, with a visible Continue button as a fallback. All title and label text here is new copy, TODO(client) |
| Success: password reset | Redirect to log in with the existing notice "Your password was updated. Log in with your new password." as a success banner |
| Rate limited (429) | Danger banner with a mono countdown, plus a link to "Forgot your password?" |
| Expired or used link | Re-show the request form with a banner (Podia pattern in `mobbin-patient-auth.md`). The WIP already has an "expired" screen |
| Offline | Info banner when `navigator.onLine` is false, and submits are held. New copy, TODO(client) |
| Already signed in | Server redirect to the user's home (already done in `login/page.tsx`) |

### 4.8 Micro-interactions

| Interaction | Spec |
|---|---|
| **Password strength** | Shows after the first keystroke under the password field. A 4-segment bar (4 px tall, 4 px gaps, fully rounded): 1 segment red-500, 2 amber-500, 3–4 emerald-500, with a 300 ms colour transition. A right-aligned 12 px label in a 64 px slot so it doesn't shift; the labels Weak/Fair/Good/Strong are new copy. **Reuse the approved helper "Must be at least 8 characters long." as the single checklist row**: grey dot, then a green check when met, so no new rule copy is needed. Use `aria-live="polite"` on the label only |
| **Confirm password match** | Once the confirm length is at least the password length, a 16 px check (emerald) or cross (red) appears inside the field before the eye button. The error text appears only on blur |
| **Caps-lock warning** | On `keydown`/`keyup` via `getModifierState("CapsLock")`, and also checked on focus. An amber-700 12 px line with a 14 px icon under the field. It clears on blur. New copy, TODO(client) (the WIP uses "Caps Lock is on.") |
| **Show/hide password** | An eye or eye-off icon swap with a 120 ms crossfade. `aria-pressed`. Never persisted |
| **Email typo fix** | On blur, a Levenshtein check (distance under 3) against common US domains, plus TLD slips like `.con`, `.cmo` and `.ocm`. Shows "Did you mean **jane@gmail.com**?" with the suggestion as a button that fixes the field and refocuses it. Never blocks submit. Already in `lib/auth/email-typos.ts`; add the TLD rules. New copy, TODO(client) |
| **Resend countdown** | A disabled button with the label and a mono `0:42`. Cooldowns of 30 s, then 60 s, then 120 s, matched by a server `rateLimit()`. After a resend: a toast plus a timer reset. Announce to screen readers **only when it becomes available**, not every second |
| **Open mail app** | Show **one** button matching the domain (gmail.com → Gmail web, outlook/hotmail/live → Outlook web, icloud → iCloud Mail). Hide it for unknown domains. Opens in a new tab. "Open Gmail" is new copy |
| **Auto-continue on verify** | While `/verify-email` is visible, poll the session every 4 s (stop when the tab is hidden), and listen on `BroadcastChannel("pm-auth")`, which the verification landing tab posts to. On success, the celebration plays and the page continues |
| **Auto-focus** | Focus the first empty field on mount: email on log in, or password if the email is pre-filled. On role choice, focus nothing; the cards are the content. On phones, don't auto-focus where the keyboard would cover the H1 (role page) |
| **Enter to submit** | Native `<form>` everywhere. `enterKeyHint="next"` on intermediate fields and `"go"` on the last. Enter on a focused role card selects it and continues |
| **Last method used** | `localStorage` key holding `"google" \| "email"` **only, never the address**. A 12 px hint under that option on log in (Linear). Wrap in try/catch. New copy, TODO(client) |
| **Swap link** | The top-right Sign in / Create account link crossfades over 150 ms, with a fixed min-width so the header doesn't twitch |

### 4.9 Page-to-page transitions ("one continuous app")

1. **Persistent shell:**
   - The header, footer, panel and step dashes live in `(auth)/layout.tsx` and never remount.
   - Only the form column changes, via `template.tsx`.
2. **Form enter:**
   - Rise 8 px, fade and blur 3 px to 0, using `--ease-out-soft`.
   - **300 ms on navigation**, 520 ms on first load only.
   - Stagger 40 ms across **at most four** blocks: heading, fields, actions, footer link. Not per field.
3. **Direction:**
   - Moving forward (Continue, Create Account, Send reset link) enters from `x +12px`.
   - Back links ("Back to log in", "Go back") enter from `x −12px`.
   - Set the direction in `AuthPanelProvider` just before navigating.
4. **Exit:**
   - The old form fades out over 140 ms.
   - This needs View Transitions: React `<ViewTransition>` behind Next's experimental `viewTransition` flag. It's still experimental, so only adopt it if the team accepts that.
   - Otherwise skip the exit; the enter alone already reads well.
5. **Panel:**
   - Scenes cross-fade: the outgoing scene fades over 300 ms; the incoming one goes from 0.98 scale and 4 px blur to 1 and 0 over 500 ms, with `--ease-out-soft`.
   - **Shared elements morph** using `view-transition-name` or FLIP:
     - the provider card shrinks into the verify envelope;
     - the paper plane carries from forgot-password to "sent".
6. **Height and position:** because the column is top-anchored (§4.1), the H1 never moves between screens. Only the content below it grows or shrinks.
7. **Focus:** after each navigation, move focus to the H1 (`tabIndex={-1}`) so screen-reader users hear the new screen.
8. **Reduced motion:** every transition becomes a 120 ms opacity fade or none. Ambient layers are static. The celebration becomes a static check.

### 4.10 Mobile behaviour (< 1024 px; test at 375 × 667 with the keyboard open)

**Layout:**
- No panel.
- Header 56 px: logo plus the swap link. Add a back chevron on screens where Figma shows `Go back` (A1–A5, not A6).
- The column starts 24 px below the header and is **never vertically centred**, so the keyboard doesn't push the H1 off screen.
- Footer: Figma's `© 2026 PsychMind. All rights reserved.` (dynamic year), plus the 988 link. The legal sentence sits under the primary button on sign-up.
- Safe area: `pb-[max(16px,env(safe-area-inset-bottom))]`. Use `min-h-svh`, never `100vh`.

**Controls:**
- Inputs and buttons 44 px tall; input text 16 px.
- Email fields: `inputMode="email"`, `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`.
- Password fields: `passwordrules="minlength: 8;"` for Safari's generator.
- Half-width pairs stack to full width below 380 px of available width.

**Replacing the panel:**
- A 40 px doodle tile above the step label (same doodle as the desktop scene).
- On provider sign-up, a collapsed **"Preview your profile"** disclosure under the form that opens the same live card (new copy, TODO(client)).

### 4.11 Accessibility and autofill checklist

- `autocomplete` tokens:
  - `email`
  - `given-name` / `family-name`
  - `organization` (business name)
  - `new-password` (sign-up, reset)
  - `current-password` (log in)
  - `one-time-code` (if codes are added)
- **Reset page:** include a hidden `<input autocomplete="username" value={email} readOnly>` so password managers save the new password against the right account.
- Role cards are a real `radiogroup` with a `<legend>`. Hover-to-preview must also fire on focus.
- Placeholder colour `#79716b` on white is about 4.8:1. Never use placeholders as labels.
- `prefers-reduced-motion`, `prefers-contrast: more` (thicker borders), and visible `:focus-visible` everywhere.

### 4.12 Screen-by-screen (Figma copy kept verbatim)

- **A1 Role:**
  - Copy: `Step 1 of 2` / `Who are you joining as?` / `This helps us set up the right experience for you.` / legend `Choose account type` / two cards / `Continue` / `Already have an account? Sign in`.
  - **Preselect from `?role=patient|provider`**, so marketing CTAs deep-link. Nothing is preselected by default.
- **A2 Create account (patient):**
  - Copy: `Step 2 of 2` / `Create your account` / `You are one step away from finding your provider.`
  - Fields: First/Last (half width), Email, Password/Confirm (half width) with the shared helper.
  - Then `Create Account`, `Or continue with`, Google.
- **A2 Create account (provider):**
  - Same layout, with the desktop subtitle `Let's build your professional profile.`
  - Adds `Business name` + `Optional` (placeholder `e.g. ThinkWell Therapy Center`) and the "Enlist with business name" checkbox card.
  - Drives the live card.
- **A3 Log in:**
  - Copy: `Welcome back` (eyebrow) / `Log in to PsychMind` / `Good to see you again. Pick up right where you left off.`
  - Fields: Email; Password with `Forgot your password?` in the label row.
  - Then `Continue`, Google, `Don't have an account? Create account`.
- **A4 Forgot:**
  - Copy: `Forgot password` / `Reset your password` / its subtitle / Email with `We will only send a link if this email is registered.` / `Send reset link` / `Remembered it? Back to log in`.
  - Carry the email over from the log-in field via client state.
- **A5 Link sent:**
  - Copy: `Link sent` + the info card (`We sent an email!`, the address, `Reset link · Expires in 30 min`) + `Didn't receive it? Check your spam folder or try again.`
  - The "try again" link becomes the resend countdown control.
  - Flag: A5's subtitle duplicates A4's (see `figma-patient-auth.md` §14).
- **A6 Set new password:**
  - Copy: `Almost done` / `Set a new password` / `Choose something secure you haven't used before.` / Password + Confirm with eye toggles / `Reset password`.
  - Add the strength meter and the hidden username field.
- **Verify email:** has no Figma frame, so all of its copy is new, TODO(client). Same shell as A5: the address, an "Open Gmail" button, resend with countdown, "Use a different email", and auto-continue.

---

## 5. Ideas the owner may have missed

1. **Role deep links and memory.**
   - Marketing CTAs such as "list your practice" land on `/signup?role=provider` with the provider card preselected.
   - The chosen role survives the Google OAuth round-trip, so a provider never lands in the patient flow.
2. **The provider preview proves the business-name rule.** Seeing *ThinkWell Therapy Center* replace *Jane Doe* on the card answers "what will patients see?" before they ask.
3. **Verification that finishes itself.** Auto-continue via BroadcastChannel or polling, plus the matching "Open Gmail" button, removes the classic dead end of a tab left waiting on "check your email".
4. **Journey context when auth interrupts a task.**
   - If a patient hits sign-up from "Request a session", show a slim context line on the form: provider avatar plus "to request a session with Dr. …".
   - This is new copy, TODO(client), and it shows the provider's name only, never anything about the patient.
   - Keep `?next=` through sign-up, verify and back (Headspace pattern).
5. **A code alongside the link.**
   - Put a 6-digit code *and* the link in the same email.
   - Many people open email on their phone but signed up on desktop. The code works across devices (Stripe or Linear style, `InputOTP` 3–3).
6. **Privacy defaults suited to a mental-health product.**
   - Never put the email in the URL (§6).
   - Remember only the method, not the address.
   - "Stay signed in" defaults to off on shared computers, if it's added.
   - Generic login errors.
   - Identical forgot-password responses for known and unknown emails.
7. **Persistent 988.** A small, always-visible crisis link in the auth footer. Someone in distress may land on log in first. The WIP already has it; keep it in the mobile footer as well.
8. **Passkeys later.** Linear, Vercel and Stripe all offer them. Better Auth has a passkey plugin. Design the log-in stack so a "Continue with passkey" row can slot under Google without a redesign.
9. **Honest panel content.**
   - No invented stats or testimonials.
   - Use approved Figma trust lines, real counts only once they're true, and client-approved quotes from the marketing site.
10. **Celebrate once, not everywhere.** CLAUDE.md allows GSAP only for celebratory moments. Spend it on "email confirmed", the bridge into onboarding, and nowhere else in auth.
11. **Anti-phishing note** (Stripe): a 12 px "PsychMind will never email you a login link you didn't request" under the log-in form. Low cost, and a good fit for a sensitive category. New copy, TODO(client).
12. **Password-manager polish.** Correct `autocomplete` tokens, the hidden username field on reset, and `passwordrules`. These invisible details are what make Vercel- and Linear-level auth feel effortless.

---

## 6. Flags against the current working tree (observed 2026-10-08)

These are things to fix during the build. No files were changed by this research.

1. **iOS zoom.**
   - `components/auth/fields.tsx` sets `fieldClass = "h-10 text-[14px] …"`, which overrides `Input`'s `text-base md:text-sm`.
   - 14 px inputs make iOS Safari zoom in on focus.
   - **Fix:** use `text-base md:text-sm`, plus `h-11 sm:h-10`.
2. **Email in URLs.**
   - `server/auth/actions.ts` redirects to `/verify-email?email=…` and `/forgot-password/sent?email=…`.
   - On a mental-health site, an address in the URL leaks into history, logs, analytics and referrers.
   - **Fix:** carry the address in `AuthPanelProvider`/`sessionStorage`, or in a short-lived httpOnly cookie read on the server.
3. **Copy drift from approved Figma strings:**
   - `auth-top-link.tsx` uses "New to PsychMind?" / "Log in", but Figma has `Don't have an account? Create account` and `Already have an account? Sign in`.
   - The layout footer drops Figma's `By clicking continue, you agree to our Terms of Service and Privacy Policy.` That sentence is required on every desktop auth screen. At minimum, keep it under the submit on sign-up and log in.
   - The panel captions in `portal-panel.tsx` are new copy. They are already marked TODO(client); consider replacing them with the approved trust lines.
4. **One-off sizes.** `AuthTitle` uses `text-[26px] leading-8 tracking-[-0.03em]`. Use `type-ui-title` (22/28) for screen titles and `type-ui-display` for success moments, per the "no one-off pixel values" rule.
5. **Motion length.** `animate-ui-enter` is 520 ms with blur on **every** auth navigation. Shorten it to ~300 ms after the first load and stagger blocks, not every element (§4.9).
6. **Error colour.** Make sure no error or invalid state uses `brand-primary`; use red with an icon (§4.6).
