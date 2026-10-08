# PsychMind: provider onboarding wizard design brief

Inspiration research and design direction for the provider onboarding flow that follows account creation. It covers the welcome screen, 9 steps, review and submit, and the "submitted, we're reviewing you" state, with a live public-profile preview beside the form.

- **Sources:** 12 Mobbin searches (web), looked at screen by screen, plus `figma-provider.md` (P0–P6), `src/app/globals.css` (the `.app-ui` portal tokens) and `CLAUDE.md` UI rules.
- **Copy rule (memory + CLAUDE.md):** Figma copy is client-approved. Restyle freely, but never reword it. Any copy below that is not in Figma is marked **[new copy, TODO(client)]**: it shows intent, not final wording. Content problems are listed in §7, not fixed.
- **Tokens:** every size below maps to an existing token: `type-ui-*` roles, `.app-ui` radii (button and field 8, card 14, tag 6), `shadow-control/card/raised`, `--ease-out-soft`, the warm scale and `brand-primary`. Pixel values are given so the targets are clear; they are not new tokens.

---

## 0. TL;DR

1. **Three zones on wide screens:** a grouped step rail, a 600px form column, and a sticky live preview "stage" that takes all remaining width. Below 1280 the rail folds into a step menu in the top bar. Below 1024 the preview becomes a sheet or drawer.
2. **9 steps in 3 phases:** *About you* (Identity, Photo, Story), *Your practice* (Who you work with, Expertise, Fees & background, Locations) and *Verification* (Credentials, Review & submit). Progress is weighted by time, not by step count.
3. **The preview is the hero:**
   - It shows the real public-profile component in a browser or phone frame.
   - Toggles: Desktop / Mobile, and a third view, **Search card**.
   - Two-way highlighting: focusing a field outlines its spot in the preview, and clicking the preview focuses the field.
   - A fold line shows where "Read more" cuts the text.
4. **Quiet autosave** in the top bar (Saved / Saving… / Offline / Retry), plus **Save & exit** and a resume email.
5. **Keyboard:** ⌘/Ctrl+Enter saves and continues, and ⌘/Ctrl+K jumps to any step.
6. **Motion:** short directional fades for step changes, a check that draws itself on the rail, and pulses in the preview on discrete changes. The single GSAP moment is the submit celebration. No smooth scrolling anywhere.

---

## 1. References: what to steal

These are 18 primary references, chosen after looking at each image.

| # | App, screen | Mobbin | Steal this |
|---|---|---|---|
| 1 | Later: Link-in-bio editor | https://mobbin.com/screens/15baa313-e118-4d84-88c6-764363b55d45 | The preview block you are editing gets an accent outline inside a phone frame. This is the model for field-to-preview highlighting. |
| 2 | Polywork: Edit info | https://mobbin.com/screens/467158e0-f561-4ca4-9333-d43fa06c0559 | A narrow form column plus a large preview, with a **desktop/mobile icon toggle** and "View site" above the preview. |
| 3 | Digg: Edit profile | https://mobbin.com/screens/f727f4b8-c88e-441c-83df-41033a214470 | A "Previewing changes" pill on the preview card, and counters on the label row ("41/280 characters"). |
| 4 | Biosites: Profile editor | https://mobbin.com/screens/ae3fee6e-6fc2-406c-905a-35a301197c11 | The preview sits on a soft "stage" with the **public URL pill** above the device. Template thumbnails work as a visual radio for the banner style. |
| 5 | Buffer: Start page builder | https://mobbin.com/screens/fdadbfd7-2783-4d7f-adec-3a36d96ea1d3 | Header layout picked through thumbnail radio cards with a thick selected ring, a collapsible editor panel, and an inline counter (36/150). |
| 6 | Stripe: Activate payments | https://mobbin.com/screens/2c044ffb-25a4-42a2-97be-910a8f66b805 | Numbered top-level steps with **nested sub-steps** in the left rail. The top bar has an X to exit and "Need help? Contact…". There is one primary action per page. |
| 7 | Airwallex: Verification | https://mobbin.com/screens/46ffc356-2124-40a9-9d5a-3b83aea2ad91 | **Phase groups** in the rail ("Get started / Business profile / Business owner") that collapse, with a check per finished sub-step. Buttons: "Save & Next" plus Back. |
| 8 | Mercury: Application | https://mobbin.com/screens/dc0439ec-d0b0-4bf9-946e-6e4ca8546aab | A large "3 / 6" counter above the step list, and a **2px progress hairline** along the bottom edge of the header. |
| 9 | Stripe: Connect setup intro | https://mobbin.com/screens/d670c548-b885-417a-8122-f65da3dc2803 | The welcome layout. On the left: headline, "Takes about 5 minutes" and "You can change before submitting" as icon rows, and one CTA. On the right: a numbered 3-step overview. "Save and exit" sits top right. |
| 10 | Melio: Get started | https://mobbin.com/screens/f380e3c1-0c86-400e-aaff-5821143e501f | "Takes 4–5 minutes · Each step is saved as you progress" plus an **"Info you'll need"** checklist on the first screen. |
| 11 | HoneyBook: Setup guide (flow) | https://mobbin.com/flows/1922e5d2-1f9c-43c7-82ba-6bbc28fba7d9 | A **time estimate per step** ("2 mins") and a checklist that ticks itself as you go. |
| 12 | Upwork: Bio step | https://mobbin.com/screens/134bc1bd-fd98-48c8-bba2-d3416a081452 | An **example profile card next to the textarea**, "characters left" under the field, and a CTA that names the next step ("Next, set your rate"). |
| 13 | Upwork: Skills | https://mobbin.com/screens/4e3b8596-da19-47a2-bc3e-b1348b6ea8cf | A search input above suggested chips with a "+" glyph, a "Max 15 skills" cap, and a "Pro tip" quote card on the side. |
| 14 | Braintrust: Skills | https://mobbin.com/screens/5e0a6e0f-48c3-4aa2-9696-c2f1bc470f60 | A **star toggle marks one "top skill"** in the selected list. This is exactly the "main specialty" pattern. |
| 15 | Upwork: Photo modal | https://mobbin.com/screens/23c72057-5bb8-4d8f-8632-b25d532aeca9 | Crop with a drag "Move" handle, zoom slider and rotate, plus **previews at several sizes** and photo rules ("Must be an actual photo of you"). |
| 16 | Mercury: Crop error | https://mobbin.com/screens/6d1ce6ce-5cf7-4b5b-b210-728be893d541 | An inline crop error ("Crop is too large. Please zoom in.") that disables Save. Hint: "Scroll to resize, drag to move". |
| 17 | Squarespace Payments: Review and submit | https://mobbin.com/screens/b19dd03b-8221-4d41-b2df-22bb93a27c8a | A banner saying you can't submit until all sections are complete, an **Edit button per section**, and a "Verifying" pill. "Close & save for later" and "Restart setup" in the side panel. |
| 18 | Mercury: Under review | https://mobbin.com/screens/2a7de612-6f88-42d7-bce5-1d8fe2219314 | "You're nearly there! We're reviewing your application" plus an **application timeline card** (Apply, submitted Jun 4 → Request for info → In review → Account ready) and a support email. |

**Also worth a look** (supporting patterns):
- **Airwallex submitted:** a 3-node horizontal tracker (Completed, In review, Pending) and "expect 1–3 business days". https://mobbin.com/screens/c9945b6f-44b1-4f9e-b473-123979101a3c
- **Hers status:** a vertical timeline with "avg 12 hrs" duration badges and "You'll be notified via SMS, email". https://mobbin.com/screens/86231ec9-1c2b-4255-bfe0-8f30a3c32e4d
- **Substack editor:** a tiny "● Saved" pill next to Back, with Preview and Continue top right. https://mobbin.com/screens/f3ea2f0b-10c4-42af-a455-e9b6bb73079a
- **Fabric setup:** a "Continue ↵" key hint and a full-width Back/Continue footer bar. https://mobbin.com/flows/c1b3da82-b599-4e48-88ee-2d2d8c91e4b9
- **StackAI usage:** a segmented tick meter ("2/2 active projects"). https://mobbin.com/screens/a2976bbf-d4f1-407f-8c56-88779215f037
- **Unify usage:** "385 / 500 used" with "Upgrade plan" inline. https://mobbin.com/screens/34bc05a5-e664-4772-9308-462fde6a7c01
- **Revolut Business receipts:** the file row status reads "Scanning…", then "Match found". https://mobbin.com/screens/2a7be71f-2e9a-404c-9c56-c846d8616783
- **Zillow lease review:** a "Complete" badge per section and Save & exit. https://mobbin.com/screens/7f0572d9-2854-4acc-9155-5c3518b5240a
- **User Interviews:** a "Profile strength" bar in the side rail. https://mobbin.com/screens/f6eda935-f2d0-4882-bbd6-e7fd2f3b59fb
- **Substack interests:** the CTA reads "Select 3 more to continue". https://mobbin.com/screens/898419be-fb09-44aa-a5bb-4ce7181bd503

**Patterns to avoid:**
- HoneyBook and Xero dashboard checklists. They are post-signup checklists, not a focused wizard.
- Bonsai's stock-photo right panel. It wastes the space the live preview should own.
- Gusto and Melio's "Feedback" side tabs, which are noise.

---

## 2. Overall layout

### 2.1 Decision: a sidebar step list, not a top-bar-only stepper

The flow takes about 20 minutes, has 9 steps and is often finished across several sessions. A rail (Stripe, Airwallex) gives three things a top stepper can't:
- non-linear jumps;
- per-step state (done, in progress, needs attention);
- a home for "time left" and profile strength.

The top bar stays slim and carries status: autosave, Save & exit, and the progress hairline. The preview gets the largest share of the screen because it is the differentiator.

### 2.2 Phases (rail groups)

| Phase [new copy, TODO(client)] | Steps (time estimate) | Figma source |
|---|---|---|
| **About you** | 1 Identity (2 min) · 2 Photo (1 min) · 3 Story (5 min) | P1, P2, P3 |
| **Your practice** | 4 Who you work with (1 min) · 5 Expertise (3 min) · 6 Fees & background (3 min) · 7 Practice locations (2 min) | P4a, P4b, (new), P5 |
| **Verification** | 8 Credentials (2 min) · 9 Review & submit (1 min) | P6, (new) |

- The estimates total about 20 min, which matches Figma's "Takes about 20 minutes".
- Progress % is the sum of the minutes of completed steps divided by 20, so finishing Story moves the bar more than finishing Photo.
- The step header keeps Figma's "Step **N** of M" format through the existing `StepProgress` component. M becomes 9 (§7).

### 2.3 Breakpoints and zones

| Width | Layout |
|---|---|
| **≥1280 (xl)** | Rail **240** · Form column **600** (content max 520, padding x 40) · Preview stage **fluid, min 480**, sticky |
| **1024–1279 (lg)** | No rail. The step menu moves into the top bar (`Step 4 of 9 · Expertise ▾` opens a Command popover with phases). Form **560** · Preview fluid (min 440) |
| **640–1023 (sm–md)** | Single column, form max 600, centered. The header gets a **"Preview profile"** button (Figma mobile copy) that opens a right **Sheet** (480 wide) |
| **<640** | Form full width with a **16px gutter**. Sticky bottom action bar (64 + safe-area). The preview opens as a full-screen **Drawer** with a **"Go to editor"** header button (Figma PV copy). Mobile frame only, no device toggle |

### 2.4 Top bar (all steps)

- **Size and surface:** 56px tall, `bg-white/85` with backdrop blur, `border-b` warm-200.
- **Left:** logo (20–24px tall), a 1px divider, and "Provider setup" in `type-ui-label` text-secondary [new copy, TODO(client)].
- **Center (lg only):** the step menu trigger.
- **Right, in order:**
  - the autosave status;
  - a "Help" ghost link [new copy];
  - **Save & exit** (`secondary`, size `sm`, 32px) [new copy; Stripe and Zillow use the same label].
- **Progress hairline:** 2px on the bottom edge of the bar. The track is warm-200, the fill is warm-900 (ink, not crimson, per the token note "progress = ink"). Width uses `transition-[width] 600ms var(--ease-out-soft)`.

### 2.5 Step rail (xl)

**Container**
- 240 wide, `bg-warm-50`, `border-r`, padding 24 vertical and 12 horizontal, sticky, full height.

**Phase header**
- `type-overline` text-placeholder, with a count on the right ("2/3", `type-ui-mono`).
- 8px gap to the items, 24px between phases.

**Items**
- 36px tall, 8px radius, 13/18 weight 500 (`type-ui-label`).
- 16px state glyph on the left, 10px gap.
- On the right, a "2 min" (`type-ui-caption` mono, placeholder colour) appears only on steps not started yet.

**States**

| State | Glyph and style |
|---|---|
| Not started | Hollow 1.5px warm-300 circle |
| Current | `bg-white shadow-control`, text-primary. Half-filled ring glyph |
| Complete | Ink check in a filled warm-900 circle, text-secondary |
| Needs attention | Amber dot, with a tooltip saying what is missing (for example "2 fields need attention") [new copy] |
| Review (locked until 1–8 are valid) | Still clickable. It lands on the checklist, which says what is missing. Never truly disabled |

**Footer** (pinned to the bottom, 16px padding, `border-t`):
- "Profile strength" mini meter (§6) [new copy];
- "About 12 min left" [new copy] in `type-ui-small`.

### 2.6 Form column

**Step header**
- `StepProgress` text ("Step 4 of 9"). On lg and xl the segmented track is hidden; the hairline and rail already show progress.
- 12px gap, then the title in **`type-ui-title`** (Geist 600, 22/28, -0.024em).
- 6px gap, then the description in `type-ui-body` text-tertiary, max 60ch.
- **32px** before the first field.

**Field anatomy**
- Label row: `type-ui-label` text-secondary on the left. On the right, "Optional" (`type-ui-caption` placeholder colour, as Figma does) **or** a live counter.
- 8px gap, then the control.
- 6px gap, then the helper (`type-ui-small` text-tertiary).
- An error **replaces** the helper: `type-ui-small` red-600 with a 14px alert icon, `aria-describedby` linked. It is set on blur, and on submit for every field.

**Spacing**
- 24px between fields (`gap-6`).
- 40px plus a `Separator` between groups.
- Two-column rows (first/last name, city/ZIP) use `gap-4`.

**Controls**

| Control | Desktop | Touch (<640) |
|---|---|---|
| Input / Select / Combobox | 40px tall, 14px text, radius 8, `shadow-control`, warm-200 border, focus ring brand | 44px |
| Textarea | min 160px, grows to 360px, then scrolls | same |
| Chip (ChoiceChips `chip` variant) | 32px tall, padding x 12, 13px label, radius 6 | 36px |
| Buttons | `md` 36px; footer primary `lg` 40px | same |

**Sticky action footer** (inside the form column, not full width)
- 64px tall, `border-t`, `bg-white/90` with blur.
- Left: **Go back** (`secondary`, Figma copy; hidden on step 1 on desktop, as Figma does).
- Right: a `Kbd` hint "⌘ ↵" (placeholder colour), then **Save and continue** (`brand`, `lg`; Figma copy).
- The primary button is disabled only while required fields are empty, matching Figma. Hovering the disabled button shows a tooltip listing what is missing [new copy].

### 2.7 Preview stage

**Surface**
- `bg-warm-100` with the `grain` surface. Padding 24.
- Sticky at `top: 56 + 24`, height `calc(100dvh - 104px)`.
- It has its own internal scroll; the page never scroll-jacks.

**Toolbar** (40px, centered over the frame)
- Left: Figma's **"Preview"** badge, plus a 6px pulsing dot while values are unsaved.
- Center: two `ToggleGroup`s:
  - **[Profile | Search card]** [new copy];
  - **[Desktop | Mobile]** as icon toggles with tooltips.
- Right: a URL pill (`type-ui-mono`, for example `psychmind.org/providers/sara-oliisi`; the slug follows the name as it is typed), plus an "Open full preview" icon button that opens a new tab with a private draft route.

**Frames**
- **Desktop:** browser chrome (a 32px bar with 3 warm-300 dots and a URL field), radius 14, `shadow-raised`.
  - The real `PublicProfile` component renders at a **1200px logical width** inside a `transform: scale(stageWidth/1200)` wrapper. It looks exactly like production, just smaller.
- **Mobile:** a 390×844 logical phone with a 10px warm-900 bezel and radius 48. It scales to fit the stage height (max scale 1) and is centered.
- **Search card:** the directory result card at 1:1, the first impression patients get, shown above a ghosted list of two neighbouring cards for context.

**Live binding**
- One shared react-hook-form state (`watch`) feeds the preview. There is no debounce for text.
- Images use the local object URL right away, before the upload finishes.

**Field-to-preview highlight**
- Each field carries `data-preview="title"` (and so on).
- On focus, the matching preview node gets a 2px `brand-primary/50` outline, 4px offset, radius 6, and a small tag with the field label (Ditto- and Later-style).
- If the node is outside the preview viewport, the preview container **jumps** (`scrollIntoView({ block: "center", behavior: "instant" })`), then the ring fades in. This keeps to the no-smooth-scroll rule.

**Click to edit (reverse binding)**
- Hovering a bound node in the preview shows a dashed outline and an "Edit" cursor.
- A click navigates to that step if needed and focuses the field.
- Bound nodes are buttons with `aria-label="Edit Title / credentials"`, and the rest of the preview is `inert`.

**Step anchoring**
- Entering a step jumps the preview to that step's section: Story goes to "About {first_name}", Locations to the locations block, and so on.

**Placeholders**
- Empty values render as Figma does (ghosted "Full name", empty chip slots) in warm-200 or placeholder text.

**Honesty**
- The preview shows a **"Pending verification"** neutral badge where Figma shows "Verified". See §7.

### 2.8 Autosave

**Triggers**
- An 800ms debounce after the last change, on blur, and on any step change.
- Each section is saved with a server action as a draft. One section is one row or JSON column, shared with the dashboard editor per CLAUDE.md.

| State | Display |
|---|---|
| Idle, saved | `check` 14px + "Saved" (`type-ui-small` text-placeholder). Tooltip: "Saved 2 minutes ago" [new copy] |
| Saving | A spinner appears **only if the save takes more than 400ms** (no flicker), with "Saving…" |
| Offline | A `cloud-off` icon + "Offline · saved on this device" (amber). Changes are queued in `localStorage` and flushed on reconnect |
| Failed | A red dot + "Couldn't save" + a "Retry" link. After 3 failures, a `StatusBanner` appears at the top of the form |
| Conflict (another tab) | A banner: "This draft changed in another tab." + Reload [new copy] |

### 2.9 Keyboard

- Shortcuts are listed in a `?` dialog (opened only when focus is not in a field) and shown as `Kbd` hints.
- Every chord uses ⌘ on Mac and Ctrl elsewhere.

| Keys | Action |
|---|---|
| **⌘/Ctrl + Enter** | Save and continue (works inside textareas) |
| **⌘/Ctrl + K** | Step switcher (Command dialog): 9 steps grouped by phase, plus "Switch preview to mobile/desktop", "Open full preview" and "Save & exit" |
| **Esc** | Close a dialog, drawer or popover. Inside a chip search, clear the query |
| Chips | Tab enters the group. **Arrows** move (roving tabindex), **Space** toggles. In the custom input, **Enter** adds and **Backspace** on an empty input removes the last chip |
| Banner swatches | Arrow keys move through the radio group. Selection follows focus |

Avoid ⌘[ / ⌘] (browser back/forward), ⌘P (print) and Alt+arrows (word jumps in inputs).

---

## 3. Per-step recommendations

shadcn primitives in use: `Form`, `Input`, `Textarea`, `Select`, `Command`+`Popover` (combobox), `ToggleGroup` (through `ChoiceChips`), `RadioGroup`, `Checkbox`, `Switch`, `Slider`, `Dialog`, `Sheet`, `Drawer`, `Collapsible`, `Alert`, `Badge`, `Tooltip`, `Progress`, `Skeleton`, `Sonner`, `Kbd`. Existing app blocks: `StepProgress`, `ChoiceChips`, `UploadDropzone`, `StatusBanner`, `EmptyState`, `ErrorState`.

**States shared by every step:**
- **Loading:** a skeleton of the step header plus 3 field skeletons, and a preview skeleton in the frame.
- **Save failed:** autosave states (§2.8).
- **Page error:** `ErrorState` with Retry.
- **Unauthorized:** redirect to login with `?next=`.
- **Already submitted:** redirect to the submitted screen.

### Step 1: Identity (Figma P1)

**Fields**
- First and last name side by side. Below them, **Title / credentials** at full width with Figma's helper "Appears below your name on your profile."

**Pronouns** (Optional)
- A combobox with quick picks "She/her · He/him · They/them" and free text allowed.
- The placeholder keeps Figma's "e.g: They/Them".

**Banner style** (Optional)
- A `RadioGroup` of the **12 exported swatch images** in a **6×2 grid** (each 64×40, radius 6) on xl, and 4×3 below that.
- Selected: a 2px ink ring with a 2px white inset, plus a 16px check badge in the corner (Buffer's thick selected ring).
- A tooltip gives the colour name [new copy, optional].
- The preview banner cross-fades on change.

**Business name** (Optional)
- Figma A2 shows the "Enlist with business name" checkbox card. If the business name was entered at sign-up, show it prefilled with that toggle.
- When the toggle is on, the preview **swaps the display name** live. This is a strong "aha" moment.

**Preview**
- Banner, avatar placeholder, name, title and pronouns. The name slug updates the URL pill.

**Errors**
- Required fields fail on blur with an inline message.
- Titles longer than 80 characters get a counter warning (amber at 70) [new copy, TODO(client) for the limit].

### Step 2: Photo (Figma P2)

**Empty**
- A large drop target that mirrors the public avatar shape. Figma uses a **rounded square**, so the crop mask is a rounded square too, not the circle from the references.
- Size 160×160, dashed warm-300 border, radius 14.
- Inside: an image icon and "Choose file" (Figma copy).
- The whole form column accepts a drop. While dragging over, the target turns `bg-warm-100` with a brand dashed border.
- The helper keeps Figma's "Select a picture to upload." Add the accepted types and limits **[new copy, TODO(client)]**: "JPG, PNG or WebP · up to 10 MB · at least 400×400".

**Crop dialog** (Upwork + Mercury)
- A `Dialog`, 560 wide, with the mask over the image, drag to move, zoom `Slider` and a rotate button.
- On the right, live previews at **3 sizes**: profile header 96, search card 56, header avatar 32.
- Short photo guidelines [new copy]: a recent photo of you, face centered and well lit, no logos or group photos.
- Save is disabled with an inline error when the crop is outside the bounds, as in Mercury.

**Uploading**
- The avatar shows the cropped local image right away, with a progress ring overlaid.
- The file row shows the name and size, then "Uploaded ✓".

**Errors**
- Wrong type (server byte sniff), more than 10 MB, or network failure: inline error with "Try another file".
- **Too small** (under 400px): an amber warning, not a block ("This may look blurry on large screens") [new copy].

**Filled**
- The thumbnail with **Replace** and **Remove** (ghost buttons) and a re-crop link.

### Step 3: Story (Figma P3)

**Fields**
- Two auto-growing textareas with Figma's labels and helper: "Who you work with *", "About you *", "Maximum 1600 words."
- The live **word counter** sits on the label row (Digg) in `type-ui-mono`. It turns amber at 90% and red over the limit.

**Writing guidance, without AI** (a collapsible card on the right of the label on xl, below the field on smaller screens; Upwork "Pro tip" style)

- **3 prompts per question** [new copy, TODO(client)]. For example:
  - Who you work with: "Who do you work best with?", "What brings them to you?", "What should someone hesitant know?"
  - About you: "How do sessions feel?", "What's your approach in plain words?", "What happens in a first session?"
- **"See an example":** a popover that shows **Figma's own Sara Oliisi sample answers** verbatim. They are already client-approved copy.
- **Good-length band** [new copy, numbers TODO(client)]: a thin bar under the counter with a shaded "reads best: 120–250 words" zone. It is advice, never a block.

**Preview**
- "About {first_name}" with Figma's **Read more** truncation.
- Inside the preview, a dashed **fold line** marks where truncation happens, with a caption: "Patients see this much before 'Read more'" [new copy]. It appears only while the field is focused.

**Errors**
- Required and over-limit errors.
- Paste with rich text is stripped to plain text, and paragraph breaks are kept, since Figma uses ⏎.

### Step 4: Who you work with (Figma P4a)

- Two `ChoiceChips` groups using Figma options in order:
  - **Session participants:** Individuals · Couples · Families · Groups.
  - **Age groups served:** Children · Teens · Adults +18 · Seniors.
  - Both use Figma's helper "Choose all that apply".
- With only 4 options each, make them **36px chips with a leading check that slides in** when selected (Perplexity's ✓ chips). Selected chips use Figma's styling (filled warm-800, white text).
- **Preview:** Figma's "Who I work with" chip row fills in as chips are toggled, with a 150ms pop.
- **Error:** at least one per group. The message sits under the group label, not in a toast.
- **Downstream:** Participants drive the **fee rows** in Step 6 (§3, Step 6).

### Step 5: Expertise (Figma P4b)

**Specialties**
- A search input on top (Figma placeholder "Add more") filters the chip grid live.
- The grid is **grouped under category subheads** (`type-overline`), matching Figma's preview categories ("Anxiety & mood", "Trauma", "Relationships & identity"). The full category map is TODO(client).
- Unmatched text shows a "**Add specialty**" row (Figma's link label) with the typed term. Enter adds it.
- Custom chips get a dashed border and a tooltip, "Custom: reviewed by our team" [new copy]. Admin moderation is needed.

**Selected tray**
- Above the grid: "6 selected" (mono count) with removable chips.
- **Star toggle on each selected chip** marks the **main specialty** (Braintrust). Exactly one is allowed.
- For screen readers, a visually hidden `RadioGroup` mirrors the stars.
- If none is starred, the first selected chip is the default, shown with an outline star and a hint [new copy].

**Therapy approaches**
- The same component and Figma options: CBT, Mindfulness, DBT, EMDR, Person-centered, Narrative, Attachment-based, Psychodynamic. "**Add approach**" for custom entries.

**Languages**
- A combobox (`Command`) over a full language list.
- Selected languages show as removable chips (Figma: "English ×").
- "**Add language**" is the trigger label, and "Choose a language" the placeholder (Figma).

**Caps**
- Suggest a maximum of 12 specialties and 8 approaches, shown as "6 / 12" (Upwork's "Max 15"). This keeps profiles credible. TODO(client).

**Preview**
- The main specialty shows first and emphasised under the name.
- The Specialties section is grouped by category, and the Languages line updates.

**Empty**
- If the search finds nothing: "No match. Press Enter to add '…'" [new copy].

### Step 6: Fees & background (new, absent from Figma, so all copy is [new copy, TODO(client)])

**Fees**
- **One row per participant type chosen in Step 4** (Individual session, Couples session, …), matching the preview's "INDIVIDUAL SESSION 120 USD".
- Each row has a `$` prefix input (`type-ui-mono`, tabular) and the suffix "per session".
- Unselected types don't appear, and a "Change in Step 4" link points back.

**Sliding scale**
- A `Switch`. When it is on, reveal a minimum–maximum pair of inputs (a dual-thumb `Slider` is optional and less precise).
- Preview: "Sliding scale available · $60–$120".

**Free consultation** (missed in Figma)
- A `Switch` plus a length select (15 or 20 min). Patients filter on this kind of thing.

**Accepting new clients**
- A `Switch`, on by default.
- Preview: an emerald dot plus "Accepting new clients", or a neutral "Not accepting new clients" (status colour paired with text, per CLAUDE.md).

**Gender**
- A `RadioGroup` of cards with the patient filter's values: Female, Male, Non-binary.
- Proposed additions: "Prefer to self-describe" and "Prefer not to say" (then excluded from the filter). Decision needed.

**Years of experience**
- Figma has this field optional inside each license card. It is person-level, so move it here. Flag.

**Education**
- A repeatable list. Each entry is an inline mini-form: Degree, Institution, City, Year (mono, 4 digits).
- Saved entries collapse to a summary row, "Ph.D. Clinical Psychology · Université Mohammed V, Rabat · 2015", with Edit and Remove plus up/down reorder buttons.
- **Empty state:** a dashed card, "Add your degrees and training", with an "+ Add education" button.

**Preview**
- Fees block, "Credentials & qualifications" EDUCATION lines, and the status chip.

**Errors**
- Fee must be a positive whole number, the sliding minimum must be at most the maximum, and the year must be between 1950 and the current year.

### Step 7: Practice locations (Figma P5a/b/c)

**Plan meter card** (top of the step)
- "Base plan" / "2 of 3 locations used" (Figma copy).
- A **3-segment meter** (Figma, StackAI ticks): filled segments are ink, empty ones warm-200, each 6px tall, radius 9999, gap 4.
- At 3 of 3, the "+ Add another location" button is replaced by Figma's **dark upsell alert** ("You've reached your 3-location limit" plus "Upgrade for more").

**Location cards** (`Collapsible`)
- **Collapsed row:** a mono **state badge** ("NY"), then "New York, NY" and the sub "In-person & Online · Primary location" (Figma), a chevron, and a ⋯ menu (Make primary, Remove location).
- **Expanded fields:**
  - **State:** a combobox of US states. States already added are disabled with "Already added" [new copy]. This fixes Figma's plain text input.
  - **City** and **ZIP**: ZIP is 5 digits, mono. A soft warning appears if the ZIP prefix doesn't match the state [new copy].
  - **Practice name** (Optional).
  - **Session format** chips: Online / In-person.
  - **Address** appears **only when In-person is selected**, with Figma's helper "Only shown publicly if you offer in-person sessions at this location."
  - **Primary location:** exactly one, enforced across cards.

**License compliance**
- Figma's right-hand card becomes a sky `Alert` at the top of the form, collapsible after the first view. Its copy is Figma verbatim.

**Upgrade**
- Figma P5c content in a `Dialog` (desktop) or a full `Sheet` (mobile).
- Add a **live total** line: "+$5 × 2 locations = +$10/mo" [new copy]. Figma shows no total.
- On success, the meter animates to "3 of 5" and a Sonner toast confirms. Payment collection is not designed (figma-provider §10).

**Preview**
- The locations list, with "Online in NY, TX" and in-person addresses only where allowed.

**Empty**
- With no locations yet, the first card is open by default.

### Step 8: Credentials (Figma P6)

**NPI number**, entered once at the top (person-level; Figma had it per state, see §7)
- A 10-digit mono input with a **check-digit (Luhn) validation** on blur.
- Optional: an **NPPES registry lookup**. It shows "We found: SARA OLIISI · Counselor · NY" with "That's me" or "Not me" [new copy]. This catches typos before the manual review. The lookup is public data, and only the NPI is sent.

**One license card per state from Step 7**, generated automatically
- **Header:** state, then a status badge: Not started (neutral), In progress (amber), Ready (emerald).
- "Missing a state? Edit locations" link [new copy].
- **Fields:**
  - "License number *" (mono);
  - "Issuing body *" (a combobox of known state boards with free text allowed; the board list is TODO(client)/research);
  - **License expiration date** (missed in Figma, needed for re-verification reminders; flag);
  - "Upload license document *".
- **Upload:** `UploadDropzone` with Figma's caption "PDF, JPG or PNG · Max 10MB" and the privacy line "Your document is only seen by the Psychmind verification team. It is never shared publicly." with a lock icon.

**File row states** (Revolut-style status text)

| State | Display |
|---|---|
| Uploading | Progress bar plus % |
| Checking | "Checking file…" while the server sniffs the bytes |
| Ready | Thumbnail or PDF icon, name, size, page count, and View / Replace / Remove |
| Error | Wrong type, too large, unreadable or password-protected PDF, each with its own message [new copy] |

**Preview**
- A LICENSE line per state ("NY · LMHC") with **Pending verification**. Never show "Verified".
- The license number is shown only if the client wants it public. Decision needed.

### Step 9: Review & submit (new screen)

**Banner**
- If anything is missing: an amber `Alert`, "You won't be able to submit until all sections are complete" (Squarespace pattern) [new copy], with jump links.

**Section summary**
- One card per phase. Each card lists its steps as rows: name, a short value summary (for example "6 specialties · main: Anxiety"), a status badge (Complete / "2 need attention"), and an **Edit** button.
- Edit deep-links to `step?field=x` and focuses that field. Saving the field returns the user to Review ("Back to review" replaces Go back) [new copy].

**Plan summary**
- "Base plan · $X / month · 3 licensed states" plus any extra locations.
- When billing starts (now, or after approval) is undecided. Flag.

**Attestation**
- A checkbox card (unchecked by default) with legal text supplied by the client: active license in every listed state, accurate information, consent to verification. **TODO(client/legal).**

**Submit**
- **"Submit for verification"** (`brand`, `lg`, full width on mobile) [new label, see §7].
- Disabled until everything is valid and the attestation is checked.
- Loading: an inline spinner plus "Submitting…". The page stays interactive, but the form is read-only.
- Error: an inline `Alert` with Retry, and the attestation stays checked.

**Preview**
- The full profile at 1:1, scrollable, with the "Pending verification" badge.

---

## 4. Motion

The rules come from CLAUDE.md: CSS transitions, `Reveal`, skeletons and `animate-ui-enter` in the app; GSAP only for the celebration; no Lenis or smooth scroll; reduced motion always respected.

### Step transition (forward)
- The outgoing step fades and moves 8px left over 120ms.
- The incoming header and fields use **`animate-ui-enter`** (8px rise and 3px blur, 520ms, `--ease-out-soft`), staggered with `--i` (60ms per field, capped at index 5, so 300ms at most).
- Going back mirrors the direction.
- The form column jumps to the top **instantly** (`behavior: "instant"`), then focus moves to the step `h1` (`tabIndex=-1`) for screen readers.

### Rail
- The current-item background is one absolutely positioned pill that moves with `transform: translateY()` (240ms ease-out-soft) instead of jumping.
- On completion, the check **draws** (SVG `stroke-dashoffset` over 300ms) and the count in the phase header ticks.

### Progress
- The hairline width animates over 600ms ease-out-soft.
- "About N min left" cross-fades (150ms) when it changes.
- The plan meter fills segment by segment (200ms each, 60ms stagger).

### Preview
- Typing updates instantly with no animation; animating text causes jank.
- Discrete changes (swatch, photo, chip, toggle): the changed node does an opacity and scale pulse from 0.98 to 1 over 180ms.
- New chips pop in (scale 0.9 to 1 with opacity, 200ms; not the 520ms spring, which is too bouncy for this).
- The highlight ring fades in over 150ms and out over 250ms.
- Device toggle: the frame cross-fades over 200ms while the scale settles. Width is never animated, to avoid layout thrash.

### Autosave
- The status label cross-fades over 150ms.
- After 2s, "Saved" fades from text-secondary to the placeholder colour so it doesn't attract attention.

### Submit celebration (GSAP, once, about 1.2s)
1. The CTA morphs into a check.
2. The preview card lifts (y −6, `shadow-card` to `shadow-raised`).
3. The **"Pending verification" badge stamps in** (scale 1.15 to 1 with `--ease-spring`).
4. The existing **`portal-ring` "breath"** ripples once behind the success icon on the next screen.
5. The first timeline node fills.

There is no confetti; this is health care, so keep it calm and earned.

### Reduced motion
- Everything becomes an opacity change of 120ms or less, or no change at all.
- The rail pill and hairline jump.
- No GSAP timeline runs; the final state renders statically.

---

## 5. Welcome and submitted screens

### 5.1 Welcome: "what it costs and what happens" (Figma P0, restyled)

**Layout** (xl/lg): the top bar shows only the logo, "Log out" and Help. The content is a 2-column grid, max width 1120, gap 64, vertically centered.

**Left column** (max 520), Figma P0 copy throughout:
- Eyebrow "For providers" (`type-overline`).
- H1 "Reach people who / are ready to start" in **`type-ui-display`** (Geist 600, 34/40, -0.032em).
- Sub "Psychmind connects verified mental health professionals with people actively looking for help."
- **Price card** (radius 14, `shadow-card`, padding 24):
  - the price in large mono numerals ("$10" with "/ month"; see §7 for the $10 vs $39 conflict);
  - "Base plan · 3 licensed states";
  - the plan blurb;
  - the armchair illustration at 64px, top right.
- **Feature list:** a 2×2 grid of 16px icons and `type-ui-small` text: "Cancel anytime", "Manual verification — 1 to 2 days", "No commission on sessions", "Your patient data stays private".
- **Meta row** (Melio and Stripe pattern), as icon rows: clock with "Takes about 20 minutes", then "Goes live after verification 1-2 days" (Figma copy, with "1-2 days" in brand).
- **Get started** (`brand`, `lg`) with a "↵" kbd hint, then the legal line from Figma.

**Right column:** replaces Figma's stock therapy photo.
- **"How it works"** [new copy] card: a 3-node vertical timeline (Stripe Connect's numbered list and Hers' duration badges).
  1. **Build your profile** · badge "~20 min". A tiny looping thumbnail shows a profile card assembling (CSS, 3 frames, paused for reduced motion).
  2. **License verification** · badge "1–2 business days".
  3. **Activate your listing** · badge "Same day" (TODO(client)).
- **"What you'll need"** [new copy] checklist (Melio), with neutral check icons:
  - a recent headshot;
  - NPI number;
  - license number and a license document (PDF/JPG/PNG, 10 MB or less) for each state you list;
  - degrees and training;
  - your session fees.

  It turns the 20 minutes into something people can plan for, and it reduces drop-off at Credentials.

**Returning-user variant**
- The H1 stays the same. Above it, a `StatusBanner`: "Welcome back, Sara. You're 60% done" plus a **Continue: Expertise** button [new copy].
- The rail-style checklist replaces the timeline.

**Mobile:** a single column. The order is copy, price card, "What you'll need" (collapsed into an accordion) and the CTA, with a sticky CTA bar.

### 5.2 Submitted: "we're reviewing you" (new, all copy [new copy, TODO(client)])

**Layout:** the same 2-zone grid as the wizard, without the rail. Left column max 560; the right side is the preview stage, frozen.

**Header**
- A 48px emerald check in a ring, with the `portal-ring` breath once.
- H1 (`type-ui-display`) "Submitted. We're reviewing your profile".
- Sub: "We verify every provider by hand. You'll hear from us at s•••@example.com within 1–2 business days." The email is masked, and nothing sensitive goes into the email itself.

**Status timeline card** (Mercury's card and Airwallex's nodes)
- ✓ **Profile submitted**, with the date and time (mono).
- ● **License verification**, "In review", with an amber "usually 1–2 business days" badge.
- ○ **Listing activated**, "Pending".
- A fourth conditional node, **Action needed**, appears if the reviewer asks for information (Mercury's "Request for info"). It has a CTA that deep-links to the exact field.

**"While you wait"** card, with 3 rows (icon, title, one line, chevron):
- Preview your public profile;
- Write your first blog post (the dashboard has Blogs);
- Notification settings.

**Footer**
- "Questions? Email support" plus "Go to dashboard" (`secondary`).

**Preview stage**
- The final profile in the desktop frame, with the "Pending verification" ribbon. The device toggle still works.

**Persistence**
- From now on the dashboard shows a `StatusBanner` "Under review" until approval, then an emerald "You're live" banner with "View your profile" and a one-time small celebration.

**Decisions needed**
- Can a provider edit while under review? Recommendation: yes, but edits to credentials or locations re-queue the review, and the UI warns before saving.

---

## 6. Ideas the owner may have missed

1. **"What you'll need" checklist** on the welcome screen (Melio). It lets people gather the NPI, license PDFs and headshot before they start, the main cause of abandonment at Credentials.
2. **A Search card preview mode.** The directory card is what patients see first. Let providers see and tune it, not just the full profile.
3. **Click-to-edit preview:** two-way binding between preview nodes and fields, plus focus highlighting (Later, Ditto).
4. **Truncation fold line** in the preview, so providers write the first lines for the "Read more" cut.
5. **Profile strength meter**, separate from required completeness. It is shown in the rail footer and on Review, and it nudges optional but valuable items:
   - photo present;
   - story in the good-length band;
   - at least 3 specialties with a main one;
   - fees;
   - education;
   - pronouns;
   - free consultation.

   Labels: Basic, Good, Strong [new copy]. It never blocks submission.
6. **Writing help without AI:** prompts, an example popover reusing Figma's approved Sara sample text, and a good-length band on the word counter.
7. **Per-step time estimates plus "About N min left"** (HoneyBook). Progress is weighted by minutes, not step count.
8. **Save & exit plus a resume email:** one reminder after 24h of inactivity ("Your profile is 60% done. Pick up at Expertise"), sent through Resend. It contains no health data, only the first name and step name. The link resumes at the exact step and field.
9. **NPI check digit plus NPPES lookup** to confirm identity before manual review.
10. **License expiration date** per state, which feeds re-verification reminders later.
11. **Fee rows derived from Step 4 participants.** No irrelevant fields, and the data stays consistent.
12. **Main specialty by star** in the selected tray (Braintrust) instead of a separate select.
13. **Honest preview:** "Pending verification" instead of a premature "Verified" badge.
14. **Duplicate-state guard and ZIP/state mismatch warning** on Locations, plus a **live cost total** in the upgrade dialog.
15. **Command palette (⌘/Ctrl+K) and ⌘/Ctrl+Enter**, with kbd hints on buttons (Fabric).
16. **Error summary on Continue:** if anything is invalid, focus the first invalid field and show "2 fields need attention" with jump links. The rail item turns amber.
17. **Private share link to the draft preview** (expiring token) so a provider can show a supervisor or partner before submitting. It is optional and off by default.
18. **"Continue on your phone" QR** for the headshot and license photo (the Stripe Identity and Mercury pattern). A later phase, flagged here so the data model allows uploads from a second device.

---

## 7. Content flags (do not silently fix; raise with the client)

1. **Price:** P0 shows **$10/month on desktop and $39/month on mobile**. Which is right?
2. **Step count:** Figma says "Step N of 5", but the flow is now 9 steps, plus a review. The "Step N of M" format is kept, and the numbers need sign-off.
3. **Final button label:** Figma P6 uses "Save and continue" on the last step. A distinct "Submit for verification" is needed. This is new copy.
4. **"Verified" badge** in the Figma preview before verification. Proposal: "Pending verification" [new copy].
5. **"Maximum 1600 words"** on the story fields. That is about 3 pages, so characters may have been meant. Confirm the limit.
6. **NPI** is captured per state in Figma, but it is person-level. This brief captures it once.
7. **Years of experience** sits in each license card. It is person-level; move it to Fees & background.
8. **Fees, gender, education, sliding scale, free consultation and accepting new clients** have no Figma copy at all. Step 6, the Review screen, the Submitted screen, the phase names, the autosave states, the tips and the checklist are all **TODO(client)** copy.
9. **P4b sub-line** says "patients" while P4a says "clients" (already noted in figma-provider §9). Keep each verbatim until the client decides.
10. **Attestation text** is legal copy the client must supply.
11. **Billing timing** (charge at submit or at approval) and **editing while under review** are product decisions.

---

## 8. Mobbin notice (verbatim)

---

**Your Mobbin AI usage is high this month**

Usage is unlimited during beta. If your usage stays at this level, you may need to purchase more credits once limits take effect. [View usage and plan options](https://mobbin.com/settings/billing-and-usage)
