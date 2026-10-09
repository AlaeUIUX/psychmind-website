import { z } from "zod";

// Session requests: the shape of a request and how its choices read.
// Shared by the wizard (client) and the server action.

/** Figma B2 labels for the provider's session participants. */
export const SESSION_TYPE_LABELS: Record<string, string> = {
  individuals: "Individual",
  couples: "Couples",
  families: "Family",
  groups: "Group",
};

export const FORMAT_LABELS: Record<string, string> = { online: "Online", in_person: "In-person" };

export const sessionTypeLabel = (v: string) => SESSION_TYPE_LABELS[v] ?? v;
export const formatLabel = (v: string) => FORMAT_LABELS[v] ?? v;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

export const requestSchema = z.object({
  publicId: z.string().regex(/^[a-z0-9]{8}$/),
  sessionType: z.enum(["individuals", "couples", "families", "groups"]),
  format: z.enum(["online", "in_person"]),
  note: optionalText(1000),
  name: z.string().trim().min(1, "Please enter your name.").max(100, "That name is too long."),
  email: z.email("Enter a valid email so they can reach you.").max(200),
  // Digits, spaces and the usual phone punctuation only.
  phone: optionalText(40).refine((v) => !v || /^[+()\d\s.-]{7,40}$/.test(v), "Enter a valid phone number, or leave it empty."),
  /** Hidden from people; bots fill it in. */
  website: z.string().max(200).optional(),
});

export type RequestInput = z.input<typeof requestSchema>;

/** "her", "him", "them" from pronouns like "she/her". */
export function objectPronoun(pronouns?: string | null) {
  const p = (pronouns ?? "").toLowerCase();
  if (p.startsWith("she")) return "her";
  if (p.startsWith("he")) return "him";
  return "them";
}
