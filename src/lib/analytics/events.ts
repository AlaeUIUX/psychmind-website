import { z } from "zod";
import { APPROACHES, SPECIALTIES, stateName, US_STATES } from "@/lib/taxonomy";

// What the browser reports to /api/events. Counts only: no ids for people,
// no free text. A search "term" is rebuilt on the server from known values
// (specialties, approaches, format, state), so nothing typed by a visitor —
// or injected by a script — can end up in a provider's keyword list.

export const PAGES = ["home", "search", "profile", "request"] as const;
export type Page = (typeof PAGES)[number];

const SPECIALTY_VALUES = new Set(SPECIALTIES.map((s) => s.value));
const APPROACH_VALUES = new Set<string>(APPROACHES.map((a) => a.value));
const STATE_VALUES = new Set(US_STATES.map((s) => s.value));

/** The parts of a search worth reporting (all optional). */
export const termSchema = z
  .object({
    sp: z.array(z.string().max(40)).max(10).optional(),
    ap: z.array(z.string().max(40)).max(10).optional(),
    f: z.enum(["online", "in_person"]).optional(),
    st: z.string().max(2).optional(),
  })
  .optional();
export type TermParts = z.infer<typeof termSchema>;

const publicId = z.string().regex(/^[a-z0-9]{8}$/);

export const eventSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("impression"), p: publicId, s: termSchema }),
  z.object({ t: z.literal("quick_look"), p: publicId }),
  z.object({ t: z.literal("profile_view"), p: publicId }),
  z.object({ t: z.literal("search"), s: termSchema }),
  z.object({ t: z.literal("view"), page: z.enum(PAGES) }),
]);
export type ClientEvent = z.infer<typeof eventSchema>;

export const batchSchema = z.object({ events: z.array(eventSchema).min(1).max(50) });

/** "Anxiety · CBT · Online · Florida", or null when there's nothing known to show. */
export function termLabel(parts: TermParts): string | null {
  if (!parts) return null;
  const label = (list: readonly { value: string; label: string }[], v: string) => list.find((o) => o.value === v)?.label;
  const bits = [
    ...(parts.sp ?? []).filter((v) => SPECIALTY_VALUES.has(v)).slice(0, 3).map((v) => label(SPECIALTIES, v)!),
    ...(parts.ap ?? []).filter((v) => APPROACH_VALUES.has(v)).slice(0, 2).map((v) => label(APPROACHES, v)!),
    parts.f === "online" ? "Online" : parts.f === "in_person" ? "In-person" : null,
    parts.st && STATE_VALUES.has(parts.st) ? stateName(parts.st) : null,
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : null;
}
