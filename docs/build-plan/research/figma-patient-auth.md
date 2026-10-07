# PsychMind Figma audit: patient-side and auth screens

- **Source:** Figma file `Iz0bLN6x4KoY06gYu2Mi8w`, page **"Design File"** (`108:121`), section **"User Dashboard"** (`150:3857`). The far-top-right **"Assets"** section (`656:2889`) is also covered.
- **Method:** I pulled the full node tree with `get_metadata`. For every top-level frame I read the text with `get_design_context`, which returns the actual characters (layer names are often stale, e.g. `Heading 1 → Create your account`). I checked the layouts on hi-res screenshots, read prototype reactions, hidden layers and Dev Mode annotations with read-only Plugin API queries, and cross-checked a few provider-side fields in `255:1412`. Nothing in the Figma file was modified.
- **Audit date:** 2026-10-07

> **Copy rule:** all copy is client-approved, so every quoted string below is **verbatim**, including typos, stray punctuation, curly or straight apostrophes and double spaces. Anything that looks wrong is listed in §14 ("Content issues to flag"). Do **not** silently fix it in code; raise it with the client.
>
> **Uppercase labels:** many small labels are *rendered* in caps with CSS `text-transform: uppercase`, but the source string is mixed case. This applies to filter headings, profile credential labels, booking labels and request-panel labels. Where that happens, this doc gives the source string and marks it *(rendered uppercase)*. Two strings are literally uppercase in the source: `PHONE NUMBER` (review step) and the odd-cased `AGE Groups` (filter heading).
>
> **Mock data:** names, prices, emails and locations are placeholders and are inconsistent between screens. For example, the logged-in user is "Annah Solto" while the request contact is "John Oswald". Treat them as examples, not content.

---

## 0. Quick facts

| Item | Value |
|---|---|
| Frames in `150:3857` | **43** top-level frames (22 desktop at 1600 px wide, 21 mobile at 402 px wide), in 6 sub-sections |
| Sub-sections | `148:189` Access Screens · `181:13438` Search results · `181:13440` Full profile · `242:4802` Saved profiles · `253:856` Requests · `194:14789` Request flow |
| Prototype links | **None.** The only reactions are `ON_HOVER → CHANGE_TO` hover variants on buttons, social icons and the avatar. There are no navigation links and no flow starting points, so every flow in §12 is inferred. |
| Dev Mode annotations | None |
| Hidden layers | Only image credits (`Illustration by  ` / `Ollie Watson`, `Someone else`) at opacity 0 on the auth and booking image panels, a hidden boilerplate line in the mobile filter drawer header (`I’m mentioned in a message or comment.`), and hover-state arrow icons in the footer. None of these are product content. |
| Far top-right block | Section **"Assets"** `656:2889` (x=40097, y=0, 1937×1286). It is a **component library for the home-page search tool**, not notes or annotations (see §1.1). |
| Provider sign-up variant | **Not in `150:3857`.** It lives in `255:1413` "Access Screens" inside "Provider Dashboard" (`255:1412`). See §4.7. |

---

## 1. Canvas map (page `108:121`)

| Section | Node | Position / size | Contents |
|---|---|---|---|
| Landing pages | `108:123` | x=-9385, y=0 · 14412×8075 | Marketing site (Home, How it works, Mission, Resource center, Blog, Contact). *Out of scope here.* |
| Legal pages | `150:3232` | x=5187, y=0 · 7146×5600 | Terms, Cookie, Privacy. *Out of scope.* |
| **User Dashboard** | **`150:3857`** | x=12493, y=0 · 27444×8614 | **Auth + patient app (this doc)** |
| Provider Dashboard | `255:1412` | x=12493, y=8774 · 28546×11832 | Provider sign-up, onboarding, dashboard. *Out of scope; only cross-referenced.* |
| **Assets** | **`656:2889`** | x=40097, y=0 · 1937×1286 | **The small far-top-right block** (see 1.1) |

### 1.1 The "Assets" block (`656:2889`): search-tool components for the Home hero

There are no notes or annotations in it. It holds three frames:

1. **`343:22019` "Search Tool"** (1230×180), the composite home search bar:
   - Segment **"Physical/Online"**: labels `In-person` and `Online` above a slider-style toggle.
   - Segment **"What's on your mind"**: label `What's on your mind?`, placeholder `What would you like to work on?`.
   - Segment **"Who feels right"**: label `Who feels right`, plus a secondary button with a "+" icon labelled `Add preferences`.
   - Round brand-red **Search Button** with a magnifier icon.
2. **`343:22149` "Physical"**, the component set for the In-person/Online toggle. It has two variants (`Property 1=Online`), and the code exposes a boolean `isOnline`:
   - State A: `Online` emphasised, knob right.
   - State B: `In-person` emphasised, knob left.
3. **`343:22152` "What's on your mind"**, a component set with 3 variants:
   - `Property 1=Default`: label `What's on your mind?` with placeholder `What would you like to work on?`.
   - Typing/autocomplete variant (`343:22150`, 462×316):
     - Input shows `An|xiety`: typed "An", caret, then a greyed autocomplete completion "xiety".
     - Suggestion chips below it: **`Anxiety`** (selected, dark), `Trauma`, `PTSD`, `Depression`, `Family issues`, `Cultural changes`.
   - `Property 1=Variant3`: filled state, a single removable chip `I need help with trauma` with a ⊗ clear icon.

> **Build implication:** the "What's on your mind?" field is free text with autocomplete suggestions. The result becomes a chip-like phrase such as "I need help with trauma". "Who feels right" opens a preferences picker via `Add preferences`, but **no preferences picker/popover is designed anywhere** (see Gaps).

---

## 2. Frame index (all 43 frames in `150:3857`)

Most mobile frames are generically named "Psychmind - Landing page - Mobile" or "…A note to Sara - Mobile". The "Screen / state" column gives what each frame actually shows.

### 2.1 Access Screens `148:189` (auth)

| # | Node | Figma name | Platform | Screen / state | Flow |
|---|---|---|---|---|---|
| A1 | `148:1155` | Psychmind - Create account - Step 1 | Desktop | Role select "Who are you joining as?" (patient card selected) | Sign up |
| A1m | `276:4840` | Psychmind - Create account - Step 1 - Mobile | Mobile | Same | Sign up |
| A2 | `148:1500` | Psychmind - Create account - Step 2 | Desktop | Create your account (patient form) | Sign up |
| A2m | `276:5178` | Psychmind - Create account - Step 1 - Mobile *(misnamed; it is Step 2)* | Mobile | Same | Sign up |
| A3 | `148:1630` | Psychmind - Login | Desktop | Log in | Log in |
| A3m | `276:5294` | Psychmind - Login - Mobile | Mobile | Same | Log in |
| A4 | `150:2501` | Psychmind - Reset - Step 1 | Desktop | Forgot password: enter email | Password reset |
| A4m | `276:5385` | Psychmind - Reset - Mobile | Mobile | Same | Password reset |
| A5 | `150:2677` | Psychmind - Reset - Step 2 | Desktop | Link sent (success state) | Password reset |
| A5m | `276:5456` | Psychmind - Reset - Mobile | Mobile | Same | Password reset |
| A6 | `150:2615` | Psychmind - Reset - Step 3 | Desktop | Set a new password | Password reset |
| A6m | `276:5521` | Psychmind - Reset - Mobile | Mobile | Same | Password reset |

### 2.2 Search results `181:13438`

| # | Node | Figma name | Platform | Screen / state | Auth state |
|---|---|---|---|---|---|
| S1 | `150:3859` | Psychmind - Search results | Desktop | Results, default (132 found) | Logged out |
| S2 | `179:9938` | Psychmind - Search results --Empty State | Desktop | 0 results, empty state and "Recommended providers" | Logged out |
| S3 | `180:12033` | Psychmind - Search results --Logged in | Desktop | Results; nav shows user pill | Logged in |
| S4 | `180:12736` | Psychmind - Search results -- Loading Skeleton | Desktop | Loading: "Searching our database..." and skeleton cards | Logged out nav |
| S5 | `278:5597` | Psychmind - Landing page - Mobile | Mobile | Results (132), cards show **Save only** | Logged out (hamburger) |
| S6 | `343:12477` | Psychmind - Landing page - Mobile | Mobile | Results with the **"Search filters" slide-out drawer open** | Logged out |
| S7 | `278:6307` | Psychmind - Landing page - Mobile | Mobile | Empty state (0) and recommended; cards show **Save and Message** | Logged out |
| S8 | `278:6697` | Psychmind - Landing page - Mobile | Mobile | Results (132); cards show **Save and Message** | Logged in (avatar pill) |
| S9 | `278:7073` | Psychmind - Landing page - Mobile | Mobile | Loading skeleton (header still says "132 providers found") | Logged in |

### 2.3 Full profile `181:13440`

| # | Node | Figma name | Platform | Screen | Auth |
|---|---|---|---|---|---|
| P1 | `183:13441` | Psychmind - Search results *(misnamed)* | Desktop | Provider profile (Sara Oliisi) | Logged out |
| P1m | `279:7536` | Psychmind - Landing page - Mobile | Mobile | Provider profile | Logged in |

### 2.4 Saved profiles `242:4802`

| # | Node | Figma name | Platform | Screen | Auth |
|---|---|---|---|---|---|
| V1 | `242:4803` | Psychmind - Saved profiles | Desktop | My saved profiles (3 cards, "Saved" state) | Logged in |
| V1m | `284:7989` | Psychmind - Landing page - Mobile | Mobile | Same (buttons still read "Save") | Logged in |

### 2.5 Requests `253:856`

| # | Node | Figma name | Platform | Screen | Auth |
|---|---|---|---|---|---|
| R1 | `253:857` | Psychmind - My bookings | Desktop | My requests (3 cards, all "Pending answer") | Logged in |
| R1m | `284:8378` | Psychmind - Landing page - Mobile | Mobile | Same | Logged in |

### 2.6 Request flow `194:14789` (session request wizard)

| # | Node (desktop) | Node (mobile) | Figma name (desktop) | Step / state |
|---|---|---|---|---|
| B1 | `194:14790` | `284:8857` | Booking - Confirm your booking | Step 1 of 5: Confirm your request |
| B2 | `196:14904` | `284:8931` | Booking - Session details | Step 2 of 5: Session type and Format |
| B3 | `196:15039` | `284:9002` | Booking - A note to Sara | Step 3 of 5: Optional message |
| B4 | `196:15135` | `284:9097` | Booking 4 | Step 4 of 5: How would you like to continue? (Log in / Create account / Guest) |
| B4g | `249:694` | `284:9196` | Booking 7 | Step 4 of 5: Guest option expanded (name, phone, email) |
| B5 | `196:15246` | `284:9294` | Booking 5 | Step 5 of 5: Review your request |
| B6 | `196:15384` | `284:9403` | Booking 6 | Confirmation, **guest** variant (CTA "Create a free account") |
| B7 | `253:802` | `284:9533` | Booking 8 | Confirmation, **account** variant (CTA "Check all requests") |

---

## 3. Global chrome and shared components

### 3.1 Desktop top nav (patient pages)
- **Left:** logo mark plus wordmark `PsychMind`.
- **Center links:** `How it works` · `Blog` · `Mission` · `Contact`.
- **Right, logged out:** text link `Log in` and a dark pill button `Create account`.
- **Right, logged in** (S3, V1, R1): pill containing a grey avatar icon, the user name `Annah Solto` and a chevron-down. The avatar has a hover variant. **No dropdown menu contents are designed** (see Gaps).

### 3.2 Mobile top nav
- Logo plus `PsychMind`.
- **Logged out:** hamburger icon (`menu`). The open menu state is **not** in this section.
- **Logged in:** pill with avatar icon and chevron (no name).
- iOS status bar mock showing `9:41`.

### 3.3 Footer (all search/profile/saved/requests pages)
- **CTA block** on a ruled-paper background with an illustration of a girl walking a path to a cabin:
  - Heading `Ready to find help?`
  - Body `It takes less than two minutes. No referral needed`
  - Dark button `Browse all` with arrow icon
- **Link column 1:** `Browse providers`, `How it works`, `Blog`, `Contact`.
- **Link column 2:** `Blog`, `Privacy Policy`, `Terms of Usage`, `Cookie Policy`.
- **Right side:** `Log in`, `Create account`. These still appear on the logged-in pages S3, V1 and R1.
- **Bottom:** `© 2026 PsychMind. All rights reserved.` plus social icons Instagram, X (Twitter), YouTube, LinkedIn, each with a hover variant.
- **Mobile footer:** same content, stacked, without the Log in/Create account pair.

### 3.4 Auth shell (A1–A6 desktop)
- Page background `#F5F5F4`, with a centered 896 px card (white, 1 px `#E5E5E5` border, radius 14).
- **Left half:** the form, 32 px padding, content width 383 px.
- **Right half:** a full-bleed illustration (icy mountains). It carries a hidden credit, "Illustration by Ollie Watson", at opacity 0, so do not render it.
- **Below the card**, centered: `By clicking continue, you agree to our Terms of Service and Privacy Policy.` with `Terms of Service` and `Privacy Policy` underlined as links. This line appears on **every** auth screen, including login and reset.
- Desktop auth has **no logo and no back button**.
- **Mobile auth:**
  - Single white card with logo `PsychMind` and an outlined `Go back` button with left arrow. A6m has no Go back.
  - No image panel and no legal line.
  - Bottom of screen: `© 2026 PsychMind. All rights reserved.` with a logo glyph.

### 3.5 Booking shell (B1–B5 desktop)
- Same as the auth shell, except the image panel is a warm sepia mountain photo (hidden credit "Someone else").
- **Progress indicator:** 5 short dashes with the current step in brand pink, above `Step N of 5`.
- **Legal line** below the card: `By clicking continue, you agree to our Terms of Service and Privacy Policy.`
- **Mobile:** logo plus `Go back` in the card, `© 2026 PsychMind. All rights reserved.` at the bottom.
- **Confirmations (B6/B7):** no card or image. Centered single column on the page background.

### 3.6 Trust lines (repeated on cards and profile)
- Shield-check icon: `Your info is never shared`.
- Network/verify icon: `Credentials manually verified`.

### 3.7 Visual tokens observed (for reference)
- **Fonts:** display/headings **Ivar Text Hydro** (24/32 on auth titles); body **Geist** (14/20 regular and medium).
- **Colours:**

  | Token | Value |
  |---|---|
  | Primary button | `#C01048` |
  | Selected card border | `#E31B54` |
  | Body text | `#1C1917` |
  | Secondary text | `#44403C` |
  | Muted text | `#737373` |
  | Card background | `#FAFAF9` |
  | Page background | `#F5F5F4` |
  | Border | `#E7E5E4` / `#E5E5E5` |
  | Dark chips/buttons | near-black |

- **Inputs:** 36 px tall, label 14 px medium above, 12.8 px horizontal padding.
- **Buttons:** primary 37.6 px tall, radius 8.

---

## 4. Auth screens (detailed)

### 4.1 A1 / A1m: Role select (`148:1155`, `276:4840`)
- **Step label:** `Step 1 of 2`, with "1" emphasised (dark) and the rest muted.
- **H1:** `Who are you joining as?`
- **Sub:** `This helps us set up the right experience for you.`
- **Group label:** `Choose account type`
- **Radio cards** (single select, the whole card is clickable):
  1. Person icon, `I am looking for a provider`, description `Find and connect with a verified mental health professional.`. **Selected state:** pink `#E31B54` border.
  2. Verified-badge icon, `I am a mental health provider`, description `Create a profile and connect with people who need your support.`. Unselected: grey border.
- **Primary button:** `Continue`. Goes to A2 for the patient; for the provider it goes to the provider Step 2 in `255:1413`.
- **Footer link:** `Already have an account? Sign in` (`Sign in` underlined, goes to A3).
- **Legal line** (desktop only).
- **States shown:** default with the patient card selected. **Not shown:** nothing-selected/disabled Continue, provider selected.
- **Note:** the provider variant in `255:1413` labels the second card `I am a provider` (not "I am a mental health provider").

### 4.2 A2 / A2m: Create your account, patient (`148:1500`, `276:5178`)
- **Step label:** `Step 2 of 2`
- **H1:** `Create your account`
- **Sub:** `You are one step away from finding your provider.`
- **Fields** (no required asterisks shown):

  | Label | Placeholder / shown value | Type | Layout |
  |---|---|---|---|
  | `First name` | `John` | text | half width, row 1 left |
  | `Last name` | `Doe` | text | half width, row 1 right |
  | `Email` | `m@example.com` | email | full width |
  | `Password` | masked dots `••••••••••` (no placeholder text) | password (no show/hide eye on this screen) | half width |
  | `Confirm Password` | masked dots | password | half width |

- **Helper under the password row:** `Must be at least 8 characters long.`
- **Primary button:** `Create Account`
- **Divider:** `Or continue with`
- **Social button:** full-width outlined button with **Google "G" logo only** (no text).
- **Footer link:** `Already have an account? Sign in`
- **Legal line:** `By clicking continue, you agree to our Terms of Service and Privacy Policy.` It says "continue" although the button says "Create Account".
- **States shown:** default only. No validation or error states.
- **Not collected:** phone number, date of birth/age, location, consent checkbox.

### 4.3 A3 / A3m: Log in (`148:1630`, `276:5294`)
- **Eyebrow:** `Welcome back`
- **H1:** `Log in to PsychMind`
- **Sub:** `Good to see you again. Pick up right where you left off.`
- **Fields:**
  - `Email`, placeholder `m@example.com`.
  - `Password`, with right-aligned link `Forgot your password?` (underlined, goes to A4) on the label row; placeholder `Enter your password`.
- **Primary button:** `Continue`
- **Divider:** `Or continue with`, then Google icon button.
- **Footer link:** `Don't have an account? Create account` (`Create account` underlined, goes to A1).
- **Legal line** (desktop).
- **States shown:** default only. No wrong-password, locked or loading state.

### 4.4 A4 / A4m: Forgot password (`150:2501`, `276:5385`)
- **Progress:** 3 dashes, first active.
- **Eyebrow:** `Forgot password`
- **H1:** `Reset your password`
- **Sub:** `Enter the email address linked to your account and we will send you a reset link.`
- **Field:** `Email`, placeholder `m@example.com`.
- **Helper (desktop only; missing on mobile):** `We will only send a link if this email is registered.`
- **Primary button:** `Send reset link`
- **Footer link:** `Remembered it? Back to log in`. `Back to log in` is underlined on desktop; the mobile string is the same.
- **Legal line** (desktop).

### 4.5 A5 / A5m: Link sent (`150:2677`, `276:5456`)
- **Progress:** 3 dashes, second active.
- **Eyebrow:** desktop `Almost done`, mobile `Forgot password` (they differ).
- **H1:** `Link sent`
- **Sub:** `Enter the email address linked to your account and we will send you a reset link.` This is the same as A4, on a confirmation screen; see §14.
- **Info card** with paper-plane line illustration:
  - Bold `We sent an email!`
  - Email `alae@movi.ai` (dynamic: the submitted email)
  - `Reset link · Expires in 30 min`, with `30 min` in brand pink. Business rule implied: **reset links expire after 30 minutes.**
- **Footer text:** `Didn't receive it? Check your spam folder or try again.` (`try again` is a link that resends or returns to A4). On mobile there is a line break after "Didn't receive it?".
- **Legal line** (desktop).
- No button on this screen.

### 4.6 A6 / A6m: Set a new password (`150:2615`, `276:5521`)
- **Progress:** 3 dashes, third active on desktop. Mobile shows the second dash active, which is a design slip.
- **Eyebrow:** `Almost done`
- **H1:** `Set a new password`
- **Sub:** desktop `Choose something secure you haven't used before.`; mobile shows the reset-link text `Enter the email address linked to your account and we will send you a reset link.` (copy slip, see §14).
- **Fields:**
  - `Password`: masked, with a **show/hide eye icon** on the right.
  - Helper `Must be at least 8 characters long.`
  - `Confirm Password`: masked, with eye icon.
- **Primary button:** `Reset password`
- **Legal line** (desktop). Mobile has **no Go back** button.
- **Not shown:** success screen after reset, expired or invalid link screen, mismatch error.

### 4.7 Cross-reference: provider sign-up (outside scope, `255:1413`)
- Role select uses the copy `I am a provider`.
- Step 2 adds `Business name` (`Optional`), placeholder `e.g. ThinkWell Therapy Center`, helper `Your full name will not show, and your profile will feature the business name`.
- **There is no "I accept insurance" checkbox** anywhere in sign-up. `PROJECT_OVERVIEW.md` is wrong on this point.

---

## 5. Search results

### 5.1 S1: Desktop search results, default (`150:3859`)

Layout, top to bottom:

1. Nav (logged out).
2. A rounded light container holding the **search tool bar** (1392×135):
   - **Format toggle:** labels `In-person` (active, dark) and `Online` (muted) above a slider toggle, knob left = In-person.
   - **`Where?`** button/pill with map-pin icon and value **`Miami, FL 33130`** (city, state, ZIP).
   - **`What's on your mind?`** pill with value `I need help with trauma` and a ⊗ clear icon.
   - **`Who feels right`** row of preference chips with icons:
     - `Female` (person icon = gender)
     - `Trauma` (filter-lines icon = specialty)
     - `PTSD` (filter-lines icon)
     - `English` (globe icon = language)
   - Round brand-red search button (magnifier).
3. Two-column body: **Filters panel** (left, 404 px) and **Results** (right, 956 px).

**Results column:**
- **Active-filter chips row:** dark chips with ✕ (removable): `Female`, `Trauma`, `PTSD`, `English`, each with the same icons as above.
- **Count line:** **`132`** (bold) + ` providers found`, with a filter/sort lines icon at the far right. **No sort menu is designed.**
- **3 provider cards** (spec in §7):
  - Sara Oliisi: `From 120 USD`, `Individual one-on-one therapy`.
  - Shatiria Johnson: `From 350 USD`, `Individual one-on-one therapy`.
  - Monica Rios: `From 450 USD`, `Individual & Group therapy`.
- **No pagination, "load more" or infinite-scroll indicator.**

Then the footer.

### 5.2 Filters panel (desktop S1–S4; identical copy in all four)

Panel header: `Filters` on the left; `Clear all` (underlined link) on the right. Section headings are *(rendered uppercase)*. Sections are separated by dividers.

| # | Section heading (source) | Control | Options (verbatim) and state shown |
|---|---|---|---|
| 1 | `Session format` | 2-tab segmented control with icons | `In-person` (map-pin icon; **selected**, white tab) · `Online` (monitor icon) |
| 2 | `Specialties` | Checkbox list with right-aligned result counts | `Trauma` **48** (checked) · `Anxiety` **91** · `Depression` **76** · `Grief & loss` **48** · link `+14 more` |
| 2b | (inside Specialties) | Text input | Label `Search specialty`, placeholder `e.g: Grief & loss` |
| 3 | `Therapy approach` | Toggle chips (multi-select presumed) | `CBT` (**selected**, dark) · `Psychodynamic` · `Mindfulness` · `DBT` · `EMDR` · `Humanistic` |
| 4 | `Provider gender` | Toggle chips | `Female` (**selected**) · `Male` · `Non-binary` |
| 5 | `Language` | Checkbox list with counts | `English` **38** (checked) · `Spanish` **12** · `French` **4** · `German` **4** · link `+14 more` |
| 6 | `AGE Groups` *(source casing; rendered "AGE GROUPS")* | Toggle chips | `Children` · `Teens` · `Adults` · `Seniors` (none selected) |
| 7 | `Financial filters` | Price range: two value pills plus a dual-handle slider | Left pill `From` + `120USD`; right pill `To` + `350USD` (no space before USD). Slider between them. |
| 7b | (inside Financial filters) | Parent checkbox with count | `Accepts Insurance` **340** (checked) |
| 7c | (nested, indented) | Checkbox list with counts | `Insurance name` **38** (checked) · `Insurance name` **12** · `Insurance name` **4** · `Insurance name` **4**. Placeholder carrier names (insurance is TBD). |

**Not present at all:** availability (days/times, "accepting new clients"), distance/radius, insurance carrier search, sliding scale, ethnicity, faith, LGBTQ+-affirming, license type, years of experience, session type (Individual/Couples/Family/Group).

### 5.3 S2: Empty state, desktop (`179:9938`)
Same as S1, except:
- The count reads **`0`** + ` providers found`.
- **Empty card:**
  - Line illustration: girl with magnifying glass and a "?".
  - Heading `We couldn’t find providers within the chosen filters` (curly ’).
  - Sub `Try tweaking filters to get more results`.
  - Dark button `Clear filters`.
- **Section header:** `Recommended providers` on the left; on the right, verified icon + `Verified by PsychMind` (non-breaking space between "by" and "PsychMind").
- **3 recommended provider cards:** the same card component and data as S1.

### 5.4 S3: Logged in, desktop (`180:12033`)
- Same as S1, but the nav shows the user pill (avatar, `Annah Solto`, chevron).
- The Save buttons are **still shown in the unsaved state** (`Save`), so no saved state on results is designed.
- Mock chip differs: Sara's second chip is `CBT` instead of `Anxiety`.
- The footer still shows `Log in` / `Create account`.

### 5.5 S4: Loading skeleton, desktop (`180:12736`)
- The search bar, filters panel and active chips stay rendered.
- The count line is replaced by a spinning logo glyph and `Searching our database...`.
- **3 skeleton cards:**
  - Grey avatar square, two grey text bars and an outlined location pill.
  - Large grey "about" block.
  - Outlined chip placeholders: 4 + 1.
  - Grey right-hand panel.

### 5.6 S5: Mobile results, logged out (`278:5597`)
- **Nav:** logo + hamburger.
- **Collapsed search card:** magnifier, `Start search`, sub `Press to get started`, and a round red search button. Presumably opens S6 or a search sheet.
- **Row:** **`132`** + ` providers found`, with an outlined button `Filters` (filter icon) on the right. It opens the drawer (S6).
- **Cards** (mobile layout, see §7.3): buttons are `See profile` and `Save` only.
- Footer.

### 5.7 S6: Mobile "Search filters" drawer (`343:12477`)
- Right-side slide-out panel (378 px wide) over a dark overlay, with a close ✕ (hover variant exists).
- **Header:** `Search filters`; sub `Filter your search results to fit your needs`.
- **Top card** (search inputs moved into the drawer):
  - `Session format`: tabs `In-person` (selected) / `Online`.
  - `Where?`: text input, value `Miami, FL`.
  - `What's on your mind?`: text input, value `I need help with trauma`.
- **Then the same sections and options as §5.2:**
  - `Specialties`: Trauma 48 ✓, Anxiety 91, Depression 76, Grief & loss 48, `+14 more`, `Search specialty` / `e.g: Grief & loss`.
  - `Therapy approach`: CBT ✓, Psychodynamic, Mindfulness, DBT, EMDR, Humanistic.
  - `Provider gender`: Female ✓, Male, Non-binary.
  - `Language`: English 38 ✓, Spanish 12, French 4, German 4, `+14 more`.
  - `AGE Groups`: Children, Teens, Adults, Seniors.
  - `Financial filters`: From 120USD / To 350USD with slider; Accepts Insurance 340 ✓; 4× Insurance name.
- **"Who feels right" is not in the drawer.**
- **Sticky footer buttons:** `Cancel` (secondary) and `Save` (primary, brand red). Note: the label is "Save", not "Apply".
- Behind the drawer, the cards in this frame include a `Message` button.

### 5.8 S7: Mobile empty state (`278:6307`)
- Same empty card copy as S2: `We couldn’t find providers within the chosen filters` / `Try tweaking filters to get more results` / `Clear filters`.
- **Mobile difference:** the section header is verified icon + `Recommended providers`, without the "Verified by PsychMind" label.
- The cards show **`Save` + `Message`** buttons side by side under `See profile`.

### 5.9 S8: Mobile results, logged in (`278:6697`)
- **Nav:** avatar pill (icon + chevron).
- `132 providers found`, `Filters`.
- Cards with **`Save` + `Message`**.

### 5.10 S9: Mobile loading skeleton (`278:7073`)
- Logged-in nav and collapsed search.
- The header **still reads `132 providers found`** with `Filters`. There is no "Searching our database..." on mobile.
- Skeleton cards stacked.

---

## 6. Taxonomy master list (future enums)

> **Completeness warning:** the Figma file does **not** contain complete lists. Specialties and Languages each show 4 options plus `+14 more`, which implies 18 each, but the 14 hidden values are not designed anywhere. Insurance carriers are placeholders. There is **no availability filter**. The lists below are everything that appears, verbatim, grouped by where it appears. The client must supply the canonical lists.

### 6.1 Patient search filters (`150:3859` and variants, `343:12477`)

| Taxonomy | Options exactly as shown | Counts shown | Control |
|---|---|---|---|
| Session format | `In-person`, `Online` | — | Tabs (filter panel) **and** a toggle in the search bar (duplicate control) |
| Location ("Where?") | Free text; examples `Miami, FL 33130` (search bar), `Miami, FL` (mobile drawer); card chip `Miami, FL 33131` | — | Text/pill; format "City, ST ZIP" |
| What's on your mind? | Free text; placeholder `What would you like to work on?`; example `I need help with trauma` | — | Text with autocomplete |
| What's on your mind? suggestions (Assets `343:22152`) | `Anxiety`, `Trauma`, `PTSD`, `Depression`, `Family issues`, `Cultural changes` | — | Suggestion chips |
| Who feels right (preference chips) | `Female`, `Trauma`, `PTSD`, `English` (gender + specialty + specialty + language); button `Add preferences` (Assets) | — | Chips |
| Specialties | `Trauma`, `Anxiety`, `Depression`, `Grief & loss` + `+14 more` (14 unknown) | 48, 91, 76, 48 | Checkboxes + `Search specialty` input (`e.g: Grief & loss`) |
| Therapy approach | `CBT`, `Psychodynamic`, `Mindfulness`, `DBT`, `EMDR`, `Humanistic` | — | Chips |
| Provider gender | `Female`, `Male`, `Non-binary` | — | Chips |
| Language (provider spoken languages; the site itself is English-only) | `English`, `Spanish`, `French`, `German` + `+14 more` (14 unknown) | 38, 12, 4, 4 | Checkboxes |
| Age groups | `Children`, `Teens`, `Adults`, `Seniors` | — | Chips |
| Price per session | Range `From` `120USD` – `To` `350USD`; currency **USD** | — | Dual slider + pills |
| Insurance | `Accepts Insurance` (parent) → `Insurance name` ×4 (placeholders) | 340; 38, 12, 4, 4 | Nested checkboxes (**TBD**) |
| Availability | **Not designed** | — | — |

### 6.2 Values on cards and profiles that are not in the filter lists

These must also map onto the enums.

- **Card tag chips:** `Trauma`, `Anxiety`, `Mindfulness`, `Thinking Disorders`, `Psychodynamic Therapy`, `Adults`, `Self-esteem`, `Holistic Wellness`, `Adolescents`, `CBT`, plus language chip `English` (globe icon). Cards mix specialties, approaches and age groups in one chip row. `Adolescents` is not an age-group option; `Psychodynamic Therapy` ≠ `Psychodynamic`; `Holistic Wellness` and `Thinking Disorders` are not in any list.
- **Profile "Specialties"** is grouped by category, with headings *(rendered uppercase)*:
  - `Anxiety & mood` → chips `Individuals`, `Couples`, `Adults 18+`. This looks like placeholder content: client types listed under a specialty category.
  - `Trauma` → `Trauma & PTSD`, `Grief & loss`.
  - `Relationships & identity` → `Relationship issues`, `Self-esteem`, `Life transitions`, `Cultural identity`.
- **Profile "Who I work with" chips:** `Individuals`, `Couples`, `Adults 18+`.
- **Session types (booking and profile):** `Individual`, `Couples`. Profile summary: `Individual · Couples`.
- **Card "Therapy type":** `Individual one-on-one therapy`, `Individual & Group therapy` (which implies Group).
- **Session format (profile and booking):** `Online & in-person` (chip), `Online & in-person available` (sidebar), `Online`, `In-person`.
- **Credential/title strings (free text):** `Counselor, LMHC, M.S., B.S.`, `Psychiatrist, M.D.`, `Licensed Professional Counselor, LPC`, `Licensed Counselor, LPC` (mobile), license type `Clinical Psychologist`.
- **Pronouns:** `she/her` (profile), `She/her` (provider onboarding).
- **Response-time strings:** `12h avg. response` (mobile cards), `48h avg. response` (saved/requests cards), `Responds within 48h` (mobile profile).

### 6.3 Provider-side inputs (cross-reference, `255:1412` onboarding)

These feed the patient filters. Option lists are verbatim from the provider onboarding chips.

| Provider field | Options shown | Mismatch with patient filter |
|---|---|---|
| `Session participants *` (`Choose all that apply`) | `Individuals`, `Couples`, `Families`, `Groups` | No patient filter for participants or session type |
| `Age groups served *` | `Children`, `Teens`, `Adults +18`, `Seniors` | Patient filter says `Adults`; profile says `Adults 18+` |
| `Specialties *` (`Add specialty`, `Add more`) | `Anxiety`, `Grief & loss`, `Burnout`, `Relationships`, `Cultural identity`, `Trauma & PTSD`, `Groups`, `Depression`, `Self-esteem`, `Life transitions` | Patient filter uses `Trauma` (not `Trauma & PTSD`); `Burnout`, `Relationships`, `Groups` are not in the visible filter list |
| `Therapy approaches *` (`Add approach`) | `CBT`, `Mindfulness`, `DBT`, `EMDR`, `Person-centered`, `Narrative`, `Attachment-based`, `Psychodynamic` | Patient filter has `Humanistic` but not `Person-centered`, `Narrative`, `Attachment-based` |
| `Languages *` (`Choose a language`, `Add language`) | `English`, `French`, `Arabic` | Patient filter shows `Spanish`, `German` but not `Arabic` |
| `Session format at this location *` | `Online`, `In-person`, `In-person & Online` | OK |
| Gender, price/fees, insurance, phone, availability | **No provider-side input exists** | Patient side filters on gender, price and insurance and shows a `Call provider` button, but there is no source field for any of them |

> **Recommendation:** define one canonical enum per taxonomy (specialty with an optional category, approach, age group, participants/session type, format, gender, language, insurance carrier) and get client sign-off on the full lists before building. Specialties need a `category` field for the grouped profile display (`Anxiety & mood`, `Trauma`, `Relationships & identity`, …).

---

## 7. Provider card (defines the list/summary data model)

### 7.1 Desktop card (S1–S3, 956×358)

**Left: photo**
- Rounded-square photo (148 px inside a 160 px white frame).

**Middle: identity and about**
- **Name:** `Sara Oliisi` (18 px medium).
- **Location chip** (top-right of the middle column): `Miami, FL 33131` with map-pin icon.
- **Credential line:** verified badge icon + `Counselor, LMHC, M.S., B.S.`. The badge implies a verified license.
- **About box** (grey panel):
  - Heading `About {FirstName}`, e.g. `About Sara`, `About Shatria` (sic), `About Monica`.
  - Excerpt truncated with `...`, followed by an underlined link `View more`.
  - Example: `I often work with adults who feel stuck, overwhelmed, or disconnected from the life they want to be living. Many are navigating anxiety, stress, relationship challenges, or questions about identity and... View more`. There is a NBSP after "I".
- **Tag chips:** about 4 tags, then a language chip with globe icon (`English`).
  - The **first chip is dark/filled** (`Trauma`) when it matches the active filter; the others are outlined. This is inferred from S1 (Trauma filter active) vs. V1 saved page (all outlined).

**Right: side panel** (grey)
- `Price per session`, then `From ` + bold `120 USD`.
- `Therapy type`, then `Individual one-on-one therapy`.
- Primary button `See profile` with ↗ icon, goes to the profile.
- Secondary button `Save` with heart icon. It toggles the saved state; the saved state is shown on V1 as a dark `Saved` button with a filled heart.
- Divider, then the trust lines `Your info is never shared` and `Credentials manually verified`.

### 7.2 Card fields to persist (provider list model)
- `photo_url`
- `display_name` (first + last; the business-name option exists on the provider side)
- `credentials_title` (free text)
- `is_verified` (badge)
- `city`, `state`, `zip`
- `about` (long text, truncated on card), or a separate short bio
- `tags[]` (specialties/approaches/age groups) and `languages[]`
- `price_from` (min session price, USD)
- `therapy_type` label (derived from session types: "Individual one-on-one therapy", "Individual & Group therapy")
- `avg_response_time` (mobile/saved only: "12h avg. response", "48h avg. response")

Context fields:
- `is_saved` (per patient)
- `match_highlight` (which tag matches the active filters)

### 7.3 Mobile card (S5–S9, 370 wide)
- **Header:** 80 px photo; name; verified icon + credential; location chip.
- **About box:** `About {FirstName}`, truncated, with `View more` inline (not underlined).
- **Chips:** wrap to two rows. Language chip with globe icon.
- **Response time:** `12h avg. response` (grey text), shown only on mobile results cards.
- **Grey panel:**
  - `Price per session` / `From 350 USD`
  - `Therapy type` / `Individual one-on-one therapy`
  - `See profile` ↗ (primary)
  - `Save` (heart icon), or **`Save` + `Message` (envelope icon) side by side** on S6, S7 and S8
  - Divider, then the trust lines.

### 7.4 Saved-page and requests-page card variants
- **Saved (V1):**
  - The About box shows the full two-paragraph "Who I work with" text, not truncated.
  - Chips are all outlined; language chip; `48h avg. response` under the chips.
  - Right panel: price / therapy type, then trust lines, then `See profile`, then **`Saved`** (dark button, filled white heart). There is no `Save` text in the saved state.
- **Requests (R1):** the right panel is replaced by request details (§10).

---

## 8. Provider profile page (P1 `183:13441` desktop, P1m `279:7536` mobile)

### 8.1 Layout (desktop)
- Nav (logged out).
- **Breadcrumb:** `Search results` › `Providers` › `Sara Oliisi` (current page, underlined).
- **Banner:** a full-width grey textured image (the provider picks a "Banner style" on the provider side). The avatar (160 px rounded square) overlaps the banner bottom-left. An outlined button `Go back to results` (← icon) sits at the bottom-right of the banner. Mobile label: `Go back`.

### 8.2 Main column
1. **Header**
   - Name `Sara Oliisi` (H1).
   - Badge (top-right on desktop): verified icon + `Verified`.
   - Credential line: verified icon + `Counselor, LMHC, M.S., B.S.`, then pronouns `she/her`.
   - Chips: `Online & in-person` (format) and `Miami, FL 33131` (map-pin).
   - **Mobile only:** clock icon + `Responds within 48h`; speech-bubble icon + `Message before request`. This conflicts with the no-messaging rule, see §15.
2. **`Who I work with`**
   - Paragraph 1: `I primarily work with adults (18+) on an individual basis, though I also offer couples sessions. My clients often come to me when they feel like they've tried to manage things on their own and need a different kind of support — not advice, but a space to think more clearly.`
   - Paragraph 2: `I work especially well with people who are skeptical about therapy, or who have tried it before and felt it wasn't quite right. I take that seriously and we talk about it openly.`
   - Chips: `Individuals`, `Couples`, `Adults 18+`.
3. **`About Sara`**
   - Paragraph 1: `I work with adults who feel stuck, overwhelmed, or disconnected from the life they want to be living. Many of my clients are navigating anxiety, stress, relationship challenges, or questions about identity — and they've often been carrying these things alone for a long time before reaching out.`
   - Paragraph 2: `My approach is collaborative and paced to your comfort. I don't believe therapy should feel like homework or a checklist. I believe it should feel like a conversation where you are genuinely heard — sometimes for the first time.`
   - Link `Read more` (underlined). The expanded state is not designed.
4. **`Specialties`**: grouped chips by category (see §6.2):
   - `Anxiety & mood`: `Individuals`, `Couples`, `Adults 18+`
   - `Trauma`: `Trauma & PTSD`, `Grief & loss`
   - `Relationships & identity`: `Relationship issues`, `Self-esteem`, `Life transitions`, `Cultural identity`
5. **`Credentials & qualifications`**: label/value rows; labels *(rendered uppercase)*.

   | Label | Value |
   |---|---|
   | `License` | `Clinical Psychologist` / verified icon + `Verified by PsychMind · License #MA-2941` / small grey `Claudia Molina Camerota` (name on license? It differs from the display name, see §14) |
   | `Education` | `Ph.D. Clinical Psychology` / `Université Mohammed V, Rabat · 2015` |
   | `Experience` | `9 years in practice` |
   | `Languages` | `French, English` |
   | `Session types` | `Individual · Couples` |

### 8.3 Sidebar card (right on desktop; after the main content on mobile)
- **Mini header:** avatar, `Sara Oliisi`, `Counselor, LMHC, M.S., B.S.`.
- **Price rows** (labels rendered uppercase):
  - `Individual session` → `120 USD`
  - `Couples session` → `160 USD`
- Monitor icon + `Online & in-person available`.
- **Buttons:**
  - **`Request a session`**: primary, brand red. Goes to B1.
  - `Call provider`: secondary, phone icon. Needs a provider phone number; nothing on the provider side collects it.
  - `Save profile`: secondary, heart icon. The saved state is not designed on the profile.
- Divider, then the trust lines `Your info is never shared` and `Credentials manually verified`.
- **Desktop:** the sidebar sits beside the header and about sections. Whether it is sticky is unknown.

Then the footer.

### 8.4 Profile data model (in addition to the card fields)
- `pronouns`
- `banner_style` / `banner_image`
- `formats[]` (online / in_person)
- `who_i_work_with` (long text) and `client_types[]` (Individuals/Couples/Adults 18+)
- `about` (long text, "Read more")
- `specialties[]` with category
- `license`: `type` (e.g. Clinical Psychologist), `number` (#MA-2941), `verified_by_admin` (bool / verified_at), `name_on_license` (?), `issuing_body` and `NPI` (provider side), `state(s)`
- `education[]`: degree, institution, location, year
- `years_experience`
- `languages[]`
- `session_types[]` with `price` per type (`Individual session 120 USD`, `Couples session 160 USD`)
- `phone` (for "Call provider")
- `response_time` (mobile)
- Locations (provider side: state, city, practice name, address; up to 3 on the base plan)

---

## 9. Saved profiles (V1 `242:4803`, V1m `284:7989`)

- **Nav:** logged in (`Annah Solto` pill).
- **Breadcrumb:** `My saved profiles` › `Providers` (underlined).
- **List:** 3 provider cards in the saved variant (§7.4). Desktop buttons: `See profile` + **`Saved`** (dark, filled heart). Mobile: `See profile` + `Save`, i.e. the saved state is not reflected; see §14.
- **No** page title other than the breadcrumb, no count, no sorting, no remove confirmation, no empty state.
- Footer (desktop still shows `Log in` / `Create account`).
- **Data:** `saved_providers` (patient_id, provider_id, created_at).

---

## 10. My requests (R1 `253:857` "My bookings", R1m `284:8378`)

- **Nav:** logged in.
- **Breadcrumb:** `My requests` › `Confirmed requests` (underlined). This contradicts the status shown, since all items are "Pending answer".
- **Request cards**, one per request:

  **Left: provider summary**
  - Photo, name, location chip, verified + credential.
  - `About {Name}`; all three desktop cards say `About Sara`, which is a template slip.
  - Chips, language, `48h avg. response` (mobile: `12h avg. response`).

  **Right: request details panel** (labels rendered uppercase)

  | Label | Value |
  |---|---|
  | `Name` | `John Oswald` |
  | `Email` | `johnos.wal@gmail.com` |
  | (divider) | |
  | `Session type` | `Individual` |
  | `Format` | `Online` |
  | `Note to Sara` | `Included` (the label uses the provider's first name; the template repeats "Sara" on every card) |
  | (divider) | |
  | | `Credentials manually verified` |

  **Buttons:**
  - `See profile` ↗ (primary).
  - **Status pill/button:** envelope icon + `Pending answer`, disabled/secondary style. **This is the only status designed.**
- **Not shown:** request date/time, request ID, phone number, the actual note text, any other status (contacted / accepted / declined / closed / expired / cancelled), cancel or withdraw action, request detail page, empty state, tabs/filters ("Confirmed requests" hints at tabs), pagination.
- **Data:** `session_request` (id, patient_id or guest contact, provider_id, contact_name, contact_email, contact_phone, session_type, format, note, status, created_at, provider_notified_at, status_updated_at).

---

## 11. Session request flow (B1–B7)

General:
- 5-step wizard; the progress indicator has 5 dashes.
- Desktop uses the booking shell. Mobile uses a card with logo and `Go back`.
- The provider summary card (avatar, `Dr. Sara Oliisi`, `Counselor, LMHC, M.S., B.S.`) repeats on steps 1–5.

### Step 1: B1 `194:14790` / `284:8857`
- `Step 1 of 5`
- **H1:** `Confirm your request`
- **Sub:** `You selected Dr.Sala Oliisi` (sic: no space after "Dr.", "Sala" not "Sara")
- **Provider card:** avatar, `Dr. Sara Oliisi`, `Counselor, LMHC, M.S., B.S.`
- **Button:** desktop `Confirm`, mobile `Continue`.
- **Legal line:** `By clicking continue, you agree to our Terms of Service and Privacy Policy.`

### Step 2: B2 `196:14904` / `284:8931`
- `Step 2 of 5`
- **H1:** `Session details`
- **Sub:** `Two quick questions so Sara knows how to prepare.`
- Provider card.
- **`Session type`** *(rendered uppercase)*: single-select chips `Individual` (**selected**, dark), `Couples`.
- **`Format`** *(rendered uppercase)*: single-select chips with icons, `Online` (monitor icon, **selected**), `In-person` (map-pin icon).
- **Button:** `Continue`
- **Notes:**
  - Options should come from the provider's offered session types and formats.
  - Families/Groups exist on the provider side but are not offered here.

### Step 3: B3 `196:15039` / `284:9002`
- `Step 3 of 5`
- **H1:** `A note to Sara`
- **Sub:** `Anything you'd like to tell before your first session? This is completely optional.`
- **Provider card** plus summary chips of prior choices: `Individual`, `Online`.
- **Field:** label `Message` *(rendered uppercase "MESSAGE")*; multi-line textarea, placeholder `Say what’s on your mind...`, optional, no character counter shown.
- **Helper:** `This goes directly to Sara. It helps her prepare but does not affect your request.`
- **Buttons:** `Continue` (primary) and `Skip for now` (secondary).

### Step 4: B4 `196:15135` / `284:9097`, account choice
- `Step 4 of 5`
- **H1:** `Almost there`
- **Sub:**
  - Desktop: `Save your request by logging in or creating a free account. Takes under a minute.`
  - Mobile: `You selected a slot — confirm it or pick a different time below.` This is stale slot-booking copy; see §14.
- Provider card (desktop only).
- **Question:** `How would you like to continue?`
- **Radio cards:**
  1. `Log in to my account` (user-key icon), `Continue with your existing account`. **Selected** (pink border).
  2. `Create a free account` (user-plus icon), tag `Recommended` (right-aligned), `Save your request and track sessions`.
  3. `Continue as guest` (user icon), `Just leave your email — no account needed`.
- **Button:** desktop `Confirm`, mobile `Continue`.
- **Inferred behaviour:**
  - "Log in" goes to A3 and then returns to step 5.
  - "Create" goes to A1/A2 and then returns to step 5.
  - "Guest" expands to B4g.
  - Logged-in users presumably skip this step, but no logged-in step numbering is designed.

### Step 4, guest expanded: B4g `249:694` / `284:9196`
- `Step 4 of 5`, `Almost there`, `Save your request by logging in or creating a free account. Takes under a minute.`
- Only the `Continue as guest` / `Just leave your email — no account needed` card is shown; the other two options are hidden.
- **Fields** (no required markers):

  | Label | Placeholder | Type |
  |---|---|---|
  | `Your name` | `Enter your full name` | text (single full-name field, unlike sign-up's first/last) |
  | `Phone number` | `Enter phone number` | tel |
  | `Email` | `m@example.com` | email |

- **Helper under the fields:** `Sara will reach out soon`
- **Button:** desktop `Confirm`, mobile `Continue`.

### Step 5: B5 `196:15246` / `284:9294`
- `Step 5 of 5`
- **H1:** `Review your request`
- **Sub:** `Everything looks right? Hit confirm and you're done.`
- Provider card.
- **Contact block** (labels rendered uppercase):
  - `Name` → `John Oswald`
  - `Email` → `johnos.wal@gmail.com`
  - `PHONE NUMBER` (literal uppercase) → `Phone number here`. Desktop only; **mobile omits the phone row.**
- **Session block:**
  - `Session type` → `Individual`
  - `Format` → `Online`
  - `Note to Sara` → `Included` (or presumably "Not included"; only "Included" is shown)
- **Button:** `Confirm request`
- **Footnote:** `No payment required now. ` then `Please contact provider for services cost.` (two lines). This confirms there is no payment in the flow.
- **No edit links per section.** Going back is the only way to change answers.

### Confirmation, guest: B6 `196:15384` / `284:9403`
- **Eyebrow:** `Request confirmed`
- **H1:** `You're all set`
- **Sub:**
  - Desktop: `You’ll be contacted by the provider directly by email or phone to confirm everything.`
  - Mobile: `Sara has received your request and will reach out to you directly within 48 hours.`
- **Card** with paper-plane illustration:
  - `We sent an email on your behalf!`
  - `johnos.wal@gmail.com` (pink)
  - Desktop: `You’ll be contacted  directly by email or phone to confirm everything.` (double space). Mobile: `She'll contact you directly by email or phone to confirm everything.`
- **Numbered steps** (desktop: circled numbers 1–3 with a connector line; mobile: prefixes "1- ", "2- ", "3- "):
  1. `Check your inbox`: `You'll receive a confirmation with the session link and a calendar invite.`
  2. `Most providers respond within 2-3 business days?` (sic "?"): `You’ll be contacted  directly by email or phone to confirm everything.`
  3. `Want to track your requests?`: `Create a free account to manage requests and save provider profiles.`
- **Buttons:**
  - `Create a free account` (primary; hover variant "Link color"). Goes to sign-up; ideally the request is attached to the new account.
  - `Back to search` (secondary). Goes to search results.

### Confirmation, account: B7 `253:802` / `284:9533`
- **Eyebrow:** `Request confirmed`
- **H1:** `You're all set`
- **Sub:** `Sara has received your request and will reach out to you directly within 48 hours.`
- **Card:**
  - `We sent an email on your behalf!`
  - `johnos.wal@gmail.com`
  - Desktop: `They will contact you directly by email or phone to confirm everything.`; mobile: `She'll contact you directly by email or phone to confirm everything.`
- **Same three steps** as B6, including step 3 "Want to track your requests? / Create a free account…", which is irrelevant for a logged-in user (see §14).
- **Buttons:** `Check all requests` (primary, goes to My requests R1) and `Back to search`.
- **Footnote:** `This request has been saved to “My requests”`

### Request form fields (summary)

| Field | Step | Required? | Source |
|---|---|---|---|
| Provider | 1 (pre-selected from profile) | yes | profile "Request a session" |
| Session type: Individual / Couples | 2 | yes (one is pre-selected) | provider's session types |
| Format: Online / In-person | 2 | yes | provider's formats |
| Message / note | 3 | **optional** ("Skip for now") | free text |
| Account choice: login / create / guest | 4 | yes (logged-out only, presumably) | — |
| Your name | 4 (guest) | presumably | — |
| Phone number | 4 (guest) | unknown | — |
| Email | 4 (guest) | presumably | — |
| Review and Confirm | 5 | — | — |

Side effects implied by the copy:
- An email goes to the provider: "We sent an email on your behalf!".
- A confirmation email goes to the patient: "Check your inbox".
- The request is saved to "My requests" for account holders.

---

## 12. Inferred flows and navigation map (no prototype links exist)

```
Landing/Home search ──► S1 Search results (S2 empty | S4 loading | S3 logged-in)
   S1 card "See profile" / "View more" ──► P1 Profile
   S1 card "Save" ──► toggle saved (logged-in) | ??? login prompt (logged-out; NOT DESIGNED)
   S2 "Clear filters" ──► S1 with filters reset
   Mobile S5 "Filters" / "Start search" ──► S6 drawer ("Cancel" closes, "Save" applies)
P1 "Request a session" ──► B1 ► B2 ► B3 (Continue | Skip for now) ► B4 (logged-out)
      B4 "Log in to my account" ──► A3 Login ──► (back to) B5
      B4 "Create a free account" ──► A1 ► A2 ──► (back to) B5
      B4 "Continue as guest" ──► B4g (name/phone/email) ──► B5
   B5 "Confirm request" ──► B6 (guest) | B7 (account)
      B6 "Create a free account" ──► A1/A2 ;  B6/B7 "Back to search" ──► S1
      B7 "Check all requests" ──► R1 My requests
P1 "Go back to results" / breadcrumb "Search results" ──► S1
P1 "Call provider" ──► tel: link (phone source undefined)
P1 "Save profile" ──► toggle saved
Nav user pill (Annah Solto ▾) ──► [menu NOT DESIGNED: My saved profiles (V1), My requests (R1), Settings?, Log out?]
A1 Role select ── patient ──► A2 ;  provider ──► provider Step 2 (255:1413) ;  "Sign in" ──► A3
A2 "Create Account" ──► [email verification? NOT DESIGNED] ──► search / return-to-flow
A3 "Continue" ──► previous page / search ; "Forgot your password?" ──► A4 ; "Create account" ──► A1
A4 "Send reset link" ──► A5 ; "Back to log in" ──► A3
A5 "try again" ──► resend / A4 ; email link ──► A6
A6 "Reset password" ──► [success NOT DESIGNED] ──► A3
Google button (A2, A3) ──► OAuth ──► [role selection for new Google users? NOT DESIGNED]
Footer: Browse providers / Browse all ──► S1 ; How it works, Blog, Contact, Privacy Policy, Terms of Usage, Cookie Policy ──► marketing/legal pages
```

---

## 13. Derived data model (patient side)

- **PatientUser:** id, first_name, last_name, email, password_hash or google_id, email_verified_at, created_at, (phone? not collected at sign-up but used in requests), role=`patient`.
- **Provider** (public listing fields; see §7.2 and §8.4):
  - `display_name` / `business_name`, `photo`, `banner_style`, `credentials_title`, `pronouns`, `is_verified`
  - Location(s): city, state, ZIP, address, practice name
  - `formats[]`, `session_types[]` with price each, `price_from` (derived), `therapy_type` label (derived)
  - `who_i_work_with`, `client_types[]`, `about`
  - `specialties[]` (with category), `approaches[]`, `age_groups[]`, `languages[]`, `gender` (**no provider input designed**)
  - `accepts_insurance` + `insurance_carriers[]` (**TBD**, no provider input designed)
  - License: type, number, issuing body, NPI, document, verified status (admin), name on license
  - Education entries, years of experience
  - `phone` (**no provider input designed**)
  - Response-time metric (**no defined source**)
  - Subscription status (unlisted when lapsed)
- **SavedProvider:** patient_id, provider_id, created_at.
- **SessionRequest:** id, provider_id, patient_id (nullable for guest), contact_name, contact_email, contact_phone, session_type, format, note (nullable), status (only `pending` is designed; label "Pending answer"), created_at, emails_sent.
- **Search facets with counts:** each checkbox option shows a live result count (Specialties, Languages, Insurance). The backend must return per-option counts given the other active filters.

---

## 14. Content issues to flag (do NOT reword; raise with the client)

1. **B1 sub:** `You selected Dr.Sala Oliisi` has a missing space and "Sala" instead of "Sara". The card also says `Dr. Sara Oliisi` while her credentials are `Counselor, LMHC, M.S., B.S.` (not a doctorate).
2. **Name mismatches:**
   - Card heading `About Shatria` vs. name `Shatiria Johnson`.
   - Requests page: all three cards say `About Sara`, and Monica's credential line reads `Counselor, LMHC, M.S., B.S.` instead of `Licensed Professional Counselor, LPC`.
   - Mobile shows `Licensed Counselor, LPC`.
3. **S1:** Shatiria's About excerpt ends with a stray `-` line.
4. **B6/B7 step 2:** `Most providers respond within 2-3 business days?` has a stray question mark.
5. **Double space** in `You’ll be contacted  directly by email or phone to confirm everything.` (B6 card and steps).
6. **Response-time claims conflict:** "within 2-3 business days" vs. "within 48 hours" vs. `Responds within 48h` vs. `12h avg. response` vs. `48h avg. response`.
7. **B6/B7 step 1:** `You'll receive a confirmation with the session link and a calendar invite.` The platform does not schedule sessions or create links; the provider contacts the patient. This conflicts with the request-only model.
8. **B7** (logged-in confirmation) still shows step 3 `Want to track your requests?` / `Create a free account to manage requests and save provider profiles.`
9. **B4 mobile sub:** `You selected a slot — confirm it or pick a different time below.` This is stale slot-booking copy that differs from desktop.
10. **A5 sub** repeats A4's instruction, `Enter the email address linked to your account and we will send you a reset link.`, on the "Link sent" confirmation. The A5 eyebrow is `Almost done` (desktop) vs. `Forgot password` (mobile).
11. **A6 mobile sub** shows the reset-link instruction instead of `Choose something secure you haven't used before.`. The A6 mobile progress shows step 2 instead of 3.
12. **A4 mobile** omits the helper `We will only send a link if this email is registered.`
13. **Legal line on login/reset/booking** reads `By clicking continue, you agree to our Terms of Service and Privacy Policy.`, but the buttons say "Create Account", "Send reset link" or "Reset password". The footer calls the page `Terms of Usage` while auth says `Terms of Service`.
14. **Footer:**
    - `Blog` appears in both link columns.
    - `Log in` / `Create account` still show for logged-in users.
15. **Filter casing:** `AGE Groups` (source casing). Price pills read `120USD` / `350USD` with no space, while cards read `120 USD`.
16. **Profile:**
    - The `Anxiety & mood` specialty group contains `Individuals`, `Couples`, `Adults 18+` (client types, likely placeholder).
    - The license block shows `Claudia Molina Camerota` under Sara Oliisi's license, and the license type is `Clinical Psychologist` while the title is `Counselor, LMHC…`.
17. **Requests:**
    - The breadcrumb `Confirmed requests` sits above items whose status is `Pending answer`.
    - The `Note to Sara` label repeats on every provider's card.
    - The page is named "My bookings" in Figma but titled "My requests".
18. **Saved mobile:** the buttons read `Save` (not `Saved`) on the saved list.
19. **Mobile drawer:** the apply button reads `Save` (alongside `Cancel`).
20. **Frame names:** "Search results" is used for the profile frame, and the mobile Step 2 sign-up frame is named "Step 1". This matters for traceability only.
21. **Taxonomy spellings and values differ** between provider onboarding and patient filters (§6.3): `Adults` / `Adults 18+` / `Adults +18`, `Trauma` / `Trauma & PTSD`, `Psychodynamic` / `Psychodynamic Therapy`, `Humanistic` vs. `Person-centered`.

---

## 15. Business-rule conflicts in the design

| Decided rule | What the design shows | Where |
|---|---|---|
| **Never in-app messaging** | `Message` button (envelope) on mobile result cards | S6 `343:12477` (behind drawer), S7 `278:6307`, S8 `278:6697` |
| | `Message before request` on the mobile profile | P1m `279:7536` |
| | (Provider side also has `Send a message` and `Message before request` in the profile preview) | `255:1539`, `337:2210` |
| | Step 3 field label is `Message`. This is acceptable as a one-way note in the request, but the label could be misread as chat. | B3 |
| **Patients have accounts** | The request flow offers `Continue as guest` (`Just leave your email — no account needed`), and the guest confirmation pitches account creation afterwards. **Decide** whether guest requests are allowed. If not, drop B4g and make step 4 log in/sign up only. | B4, B4g, B6 |
| **Request is a form; the provider is emailed** | Consistent ("We sent an email on your behalf!"). But "session link and a calendar invite" implies scheduling the platform doesn't do. | B6, B7 |
| **Patients can see request status** | Only `Pending answer` exists. There is no mechanism or design for how a status changes (the provider marks it contacted? auto-expiry?). | R1 |
| **Insurance TBD** | The filter shows `Accepts Insurance` with 4× `Insurance name` placeholders and counts. Nothing on the provider side captures insurance. | §5.2 |
| **English-only site** | Consistent. The Language filter refers to provider spoken languages (English/Spanish/French/German + 14 more). | §5.2 |
| (Implicit) contact via platform | `Call provider` button needs a provider phone number, and no provider field captures it. Decide whether the phone is public. | P1 |

---

## 16. Gaps: states and screens a real product needs that the file does not show

### 16.1 Auth
- **Field validation errors:** invalid email format, password too short, passwords don't match, email already registered, required-field empty. **No error styling exists anywhere in the file.**
- **Login errors:** wrong email/password, account not found, **rate-limited / temporarily locked**, unverified email, Google-account-only email.
- **Loading/submitting states** on all buttons (spinner, disabled).
- **Disabled `Continue`** on role select when nothing is selected; provider-selected state.
- **Email verification:** "Check your email to verify" screen, verification success, **expired/invalid verification link**, resend with cooldown.
- **Password reset:**
  - **Expired or invalid reset link** screen (links expire after 30 min per A5).
  - Reset **success** screen or toast, then back to login.
  - "try again" resend cooldown / rate limit.
  - Mismatch / too-short errors on A6.
- **Google OAuth:** error/cancelled state; new Google user role selection (role is chosen at Step 1, before Google is offered on Step 2, but login via Google for an unknown account has no path); account-linking when an email already exists.
- Show/hide password toggle on sign-up (it exists only on reset).
- **Logout** action and confirmation; session-expired screen or redirect.
- Return-to-flow after login or sign-up mid-request (preserve draft request).
- Consent: no explicit Terms/Privacy checkbox (implicit "By clicking continue" only). No age confirmation (18+), although age groups include Children/Teens, and there is no guardian flow.

### 16.2 Search
- **Search inputs:**
  - "Where?" interaction: autocomplete, "use my location", radius/distance, location required vs. Online-only.
  - "What's on your mind?" open/autocomplete state on the results page (only in Assets).
  - **"Who feels right" / `Add preferences` picker** (never designed).
- **Expanded `+14 more`** states for Specialties and Languages.
- **Sort menu** (the icon exists, no options). **Pagination / load more / infinite scroll.**
- **Logged-out "Save"** → login/sign-up prompt modal. **Saved state on result cards** (filled heart).
- **Errors:**
  - Server/network error state for search.
  - Invalid location or no location results.
  - Empty state for "no providers in your area" vs. "too many filters".
- Price slider bounds (min/max), currency formatting, "Online" mode hiding location.
- **Availability filter** and "Accepting new clients" (overview claimed availability exists; it does not).
- Mobile: collapsed search tap state (full-screen search sheet) other than the filter drawer; hamburger menu open state (not in this section).
- Mobile loading copy ("Searching our database..." is missing on mobile).

### 16.3 Provider profile
- Loading skeleton; **404 / provider not found / unlisted** (subscription lapsed or license revoked).
- `Read more` expanded About; saved state for `Save profile`; share link.
- "Call provider" behaviour (reveal number / tel: / hidden when no phone).
- Profile without banner or photo (fallback avatar); provider with a single session type or format; provider with insurance info.

### 16.4 Saved profiles
- **Empty state** ("You haven't saved any providers"), unsave confirmation/undo toast, count, sort, pagination, loading.
- Saved provider becomes unavailable (unlisted).

### 16.5 My requests (request status for patients)
- **All statuses other than `Pending answer`:** e.g. Contacted / Accepted / Declined / Closed / Expired / Cancelled by patient. Also needs status colours and copy.
- **Request detail view:** submitted date/time, full note text, phone, status history.
- **Cancel/withdraw request** and confirmation.
- **Empty state** ("No requests yet"), loading, error.
- Tabs or filters (the "Confirmed requests" breadcrumb implies them).
- How a guest's request appears after they later create an account (claiming by email).

### 16.6 Session request flow
- **Validation errors** on the guest form (name/email/phone formats, required).
- **Submit loading**, **server failure**, retry.
- **Duplicate request** to the same provider (already pending); per-user rate limit; **spam/bot protection** (CAPTCHA not designed); email verification before sending (?).
- **Logged-in path:** what step 4 looks like (skipped? the step counter would show "of 4"); pre-filled contact info; phone collection for account users (sign-up has no phone field).
- Provider no longer accepting requests or unlisted mid-flow.
- Note character limit/counter; "Not included" state on review.
- Edit links on the review step.
- Exit/abandon confirmation; deep link to the request flow when logged out.

### 16.7 Account / settings (none designed for patients)
- **User menu dropdown** (from the `Annah Solto ▾` pill): My saved profiles, My requests, Account settings, Log out.
- **Account settings:** edit name/email (re-verify), change password, connected Google account, email notification preferences.
- **Account deletion** (and data export) with confirmation. This is important for health-adjacent data.
- Privacy/consent management (cookie preferences, marketing opt-in).

### 16.8 Global
- 404 page, 500 page, offline/network error, maintenance.
- Toast/snackbar system (saved, removed, request sent, errors).
- Cookie consent banner (Cookie Policy exists).
- Crisis resource banner/disclaimer on patient pages (the landing pages mention `988 Suicide & Crisis Lifeline`; nothing in the patient app).
- Focus/keyboard states (only hover variants exist), skeletons for the profile, saved and requests pages.
- **Transactional email templates** (none designed):
  - email verification
  - password reset
  - provider "new session request" notification
  - patient request confirmation ("We sent an email on your behalf")
  - status-change notifications

---

## 17. Corrections to `figma/PROJECT_OVERVIEW.md`

- **"Role selection … provider has an 'I accept insurance' checkbox":** false. There is no such checkbox. The provider variant (`255:1413`) adds an optional `Business name` instead.
- **"Create account (client variant, provider variant w/ business name field)" listed under `150:3857`:** only the **client** variant is in `150:3857`. The provider variant is in `255:1412`.
- **"Filters (price, location/format, insurance, specialty, gender, availability)":** **there is no availability filter.** It also omits therapy approach, language and age groups.
- **"Session request flow: Confirm request → Session details → Review request → 'You're all set'":** it is actually **5 steps**: Confirm → Session details → A note to Sara (optional) → Almost there (log in / create account / guest, plus a guest form) → Review. There are **two confirmation variants**, guest and account.
- **Missing from the overview:** search **loading skeleton** and **logged-in** variants, the mobile filter drawer, the **"My requests"** page (patient request status), the guest request path, and the **Assets** component block (`656:2889`).
- **"No in-app messaging" in the overview's absent list:** mostly true, but mobile cards and the mobile profile show `Message` / `Message before request` buttons (§15).
