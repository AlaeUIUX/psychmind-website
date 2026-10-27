// The hero search bar's look, shared with the bento's previews so the picture
// of the product is the product: the same surface, labels, chips and lift.

// Corners are concentric, like the stat pill (8px chip + 4px inset = 12px)
// and the menu pill (8px items + 6px inset = 14px): inner tiles round at a
// third of their height, and each container adds the inset around them.
//   bar 66px: 48px button (16px) + 9px inset = 25px; segments 1px in = 24px
//   phone pill 56px: 40px button (13px) + 8px inset = 21px
//   format toggle: 36px tabs (12px) + 4px inset = 16px track
// Measured from Airbnb: a 66px bar (hairline border), 12px labels over 14px
// values, 1px × 32px dividers, a 48px search button. At rest it sits lightly
// on the page (a soft 0 2px 8px at 5%); opened, it lifts to Airbnb's own
// 0 8px 24px at 10%.
export const searchSurface = "border border-warm-200 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.02),0_2px_8px_rgb(0_0_0/0.05)]";
export const searchLift = "shadow-[0_0_0_1px_rgb(0_0_0/0.02),0_8px_24px_rgb(0_0_0/0.1)]";
/** The open segment, lifted as a white pill. */
export const segmentLift = "bg-white shadow-[0_3px_12px_rgb(0_0_0/0.1),0_1px_2px_rgb(0_0_0/0.08)]";
/** The other segments while one is open: frosted over, a focus pull. */
export const segmentFrost = "opacity-50 blur-[1.25px]";
/** Airbnb's label: 12px/16px medium with 2px under it, over a 14px/18px value. */
export const segmentLabel = "pb-0.5 text-xs leading-4 font-medium text-warm-900";
export const segmentValue = "truncate text-sm leading-[18px]";
/** Airbnb's panel: 425px, 32px corners, a deeper shadow. */
export const searchPanel = "w-[425px] rounded-[32px]! border-0 bg-white p-6 shadow-[0_6px_20px_rgb(0_0_0/0.2)]!";
/** A panel's small heading (with an icon) over its choices. */
export const panelHeading = "flex items-center gap-1.5 text-xs leading-4 font-medium text-warm-900 [&_svg]:size-3.5 [&_svg]:text-warm-500";
/** Topic chips, matching the preference chips (ToggleGroup's chip variant). */
export const topicChip =
  "inline-flex h-8 animate-in items-center rounded-pill border px-3 text-[13px] shadow-control transition-colors duration-200 fade-in-0 zoom-in-95";
export const topicChipOn = "border-warm-800 bg-warm-800 text-white";
/** An unpicked chip that isn't a control (a tag, a picture of the bar). */
export const topicChipIdle = "border-warm-300 bg-white text-text-secondary";
export const topicChipOff = `${topicChipIdle} hover:border-warm-600 hover:text-text-primary`;

/** Figma's "What's on your mind?" suggestions. */
export const SUGGESTIONS = ["Anxiety", "Trauma", "PTSD", "Depression", "Family issues", "Cultural changes"];
