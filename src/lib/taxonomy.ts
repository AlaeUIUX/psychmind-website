// The option lists behind provider profiles and search filters. Values marked
// "Figma" are verbatim from the design file; everything else is a DRAFT added
// so the forms are usable — the client must approve the final lists before
// launch (build plan decision D1). Keys are stable database values; labels
// are display copy and can change freely.
// TODO(client): approve every list in this file.

export type Option<K extends string = string> = { value: K; label: string };

/** Figma P4a "Session participants". */
export const SESSION_PARTICIPANTS = [
  { value: "individuals", label: "Individuals" },
  { value: "couples", label: "Couples" },
  { value: "families", label: "Families" },
  { value: "groups", label: "Groups" },
] as const satisfies readonly Option[];

/** Figma P4a "Age groups served". `profileLabel` is how the public profile prints it (Figma D2). */
export const AGE_GROUPS = [
  { value: "children", label: "Children", profileLabel: "Children" },
  { value: "teens", label: "Teens", profileLabel: "Teens" },
  { value: "adults", label: "Adults +18", profileLabel: "Adults 18+" },
  { value: "seniors", label: "Seniors", profileLabel: "Seniors" },
] as const satisfies readonly (Option & { profileLabel: string })[];

/** Specialty categories used to group chips on the public profile (Figma D2 shows the first three). */
export const SPECIALTY_CATEGORIES = [
  { value: "anxiety_mood", label: "Anxiety & mood" },
  { value: "trauma", label: "Trauma" },
  { value: "relationships_identity", label: "Relationships & identity" },
  { value: "other", label: "Other concerns" }, // draft
] as const satisfies readonly Option[];

type SpecialtyCategory = (typeof SPECIALTY_CATEGORIES)[number]["value"];

/** Figma P4b specialties first (in design order), then draft additions. Providers can also add their own. */
export const SPECIALTIES: readonly (Option & { category: SpecialtyCategory })[] = [
  { value: "anxiety", label: "Anxiety", category: "anxiety_mood" },
  { value: "grief_loss", label: "Grief & loss", category: "trauma" },
  { value: "burnout", label: "Burnout", category: "anxiety_mood" },
  { value: "relationships", label: "Relationships", category: "relationships_identity" },
  { value: "cultural_identity", label: "Cultural identity", category: "relationships_identity" },
  { value: "trauma_ptsd", label: "Trauma & PTSD", category: "trauma" },
  { value: "depression", label: "Depression", category: "anxiety_mood" },
  { value: "self_esteem", label: "Self-esteem", category: "relationships_identity" },
  { value: "life_transitions", label: "Life transitions", category: "relationships_identity" },
  // Draft additions (Figma's patient filter says "+14 more" without listing them).
  { value: "stress", label: "Stress", category: "anxiety_mood" },
  { value: "ocd", label: "OCD", category: "anxiety_mood" },
  { value: "bipolar", label: "Bipolar disorder", category: "anxiety_mood" },
  { value: "sleep", label: "Sleep", category: "anxiety_mood" },
  { value: "adhd", label: "ADHD", category: "other" },
  { value: "addiction", label: "Addiction & substance use", category: "other" },
  { value: "eating_disorders", label: "Eating disorders", category: "other" },
  { value: "chronic_illness", label: "Chronic illness", category: "other" },
  { value: "parenting", label: "Parenting", category: "relationships_identity" },
  { value: "lgbtq", label: "LGBTQ+ identity", category: "relationships_identity" },
];
// Figma's chip list also includes "Groups", which is a session type, not a
// specialty (it's in SESSION_PARTICIPANTS). Flagged to the client.

/** Figma P4b approaches first, then "Humanistic" from the patient filter, then drafts. */
export const APPROACHES = [
  { value: "cbt", label: "CBT" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "dbt", label: "DBT" },
  { value: "emdr", label: "EMDR" },
  { value: "person_centered", label: "Person-centered" },
  { value: "narrative", label: "Narrative" },
  { value: "attachment_based", label: "Attachment-based" },
  { value: "psychodynamic", label: "Psychodynamic" },
  { value: "humanistic", label: "Humanistic" },
  { value: "act", label: "Acceptance and commitment (ACT)" },
  { value: "solution_focused", label: "Solution-focused" },
  { value: "family_systems", label: "Family systems" },
  { value: "somatic", label: "Somatic" },
] as const satisfies readonly Option[];

/** Languages a provider holds sessions in (Figma shows English, French, Arabic; filter adds Spanish, German). */
export const LANGUAGES = [
  "English", "Spanish", "French", "Arabic", "German", "Mandarin", "Cantonese", "Vietnamese", "Tagalog", "Korean",
  "Russian", "Portuguese", "Italian", "Polish", "Hindi", "Urdu", "Bengali", "Punjabi", "Gujarati", "Farsi",
  "Hebrew", "Japanese", "Haitian Creole", "Greek", "Turkish", "Ukrainian", "Amharic", "Somali", "Swahili",
  "American Sign Language",
].map((label) => ({ value: label, label })) satisfies Option[];

/** Provider gender — the patient filter (Figma 6.1) offers the first three. */
export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "undisclosed", label: "Prefer not to say" }, // draft
] as const satisfies readonly Option[];

/** Figma P5 "Session format at this location". */
export const SESSION_FORMATS = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In-person" },
] as const satisfies readonly Option[];

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
  ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([value, label]) => ({ value, label })) satisfies Option[];

/** Figma P1 has 12 brush-texture banner swatches; until those are exported we
 *  tint the existing banner texture. Order matches the Figma grid. */
export const BANNER_STYLES = [
  { value: "banner_01", label: "Deep blue", color: "#1e3a8a" },
  { value: "banner_02", label: "Dark green", color: "#14532d" },
  { value: "banner_03", label: "Light grey", color: "#d6d3d1" },
  { value: "banner_04", label: "Teal", color: "#0f766e" },
  { value: "banner_05", label: "Navy", color: "#0f172a" },
  { value: "banner_06", label: "Slate", color: "#475569" },
  { value: "banner_07", label: "Emerald", color: "#047857" },
  { value: "banner_08", label: "Bright blue", color: "#2563eb" },
  { value: "banner_09", label: "Pink", color: "#db2777" },
  { value: "banner_10", label: "Violet", color: "#7c3aed" },
  { value: "banner_11", label: "Mustard", color: "#ca8a04" },
  { value: "banner_12", label: "Orange", color: "#ea580c" },
] as const;

export type BannerStyle = (typeof BANNER_STYLES)[number]["value"];

/** The standard banner until a provider picks their own: violet (Tailwind violet-600). */
export const DEFAULT_BANNER: BannerStyle = "banner_10";

/** Base plan includes this many practice locations (Figma P5: "up to 3 locations"). */
export const BASE_PLAN_LOCATIONS = 3;

const lookup = <T extends Option>(list: readonly T[]) => new Map(list.map((o) => [o.value, o]));
const maps = {
  participants: lookup(SESSION_PARTICIPANTS),
  ages: lookup(AGE_GROUPS),
  specialties: lookup(SPECIALTIES),
  approaches: lookup(APPROACHES),
  genders: lookup(GENDERS),
  formats: lookup(SESSION_FORMATS),
  states: lookup(US_STATES),
};

/** Display label for a stored value; custom (provider-typed) values print as-is. */
export function labelOf(kind: keyof typeof maps, value: string) {
  return maps[kind].get(value)?.label ?? value;
}

export function stateName(code: string) {
  return maps.states.get(code)?.label ?? code;
}

export function specialtyCategory(value: string): SpecialtyCategory {
  return maps.specialties.get(value)?.category ?? "other";
}

export function ageProfileLabel(value: string) {
  return (maps.ages.get(value) as (typeof AGE_GROUPS)[number] | undefined)?.profileLabel ?? value;
}
