import { labelOf, stateName } from "@/lib/taxonomy";
import type { ProfileView } from "./types";

// How a provider's details read on cards, the quick view and the profile.

export function displayName(p: ProfileView) {
  if (p.displayAsBusiness && p.businessName) return p.businessName;
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}

/** "Sara" (or the business name) for "About Sara", "Save Sara"… */
export function shortName(p: ProfileView) {
  return p.displayAsBusiness && p.businessName ? p.businessName : (p.firstName ?? "");
}

const PARTICIPANT_WORD: Record<string, string> = { individuals: "Individual", couples: "Couples", families: "Family", groups: "Group" };

/** Figma card copy: "Individual one-on-one therapy", "Individual & Group therapy". */
export function therapyType(participants: string[] = []) {
  const words = participants.map((p) => PARTICIPANT_WORD[p] ?? labelOf("participants", p));
  if (!words.length) return null;
  if (words.length === 1 && participants[0] === "individuals") return "Individual one-on-one therapy";
  const list = words.length > 1 ? `${words.slice(0, -1).join(", ")} & ${words.at(-1)}` : words[0];
  return `${list} therapy`;
}

export function primaryLocation(p: ProfileView) {
  return p.locations?.find((l) => l.isPrimary) ?? p.locations?.[0];
}

/** "Miami, FL 33131", or "Online" when they only see clients online. */
export function locationLabel(p: ProfileView) {
  const inPerson = p.locations?.find((l) => l.formats.includes("in_person"));
  const l = inPerson ?? primaryLocation(p);
  if (!l) return null;
  if (!inPerson) return "Online";
  return `${l.city}, ${l.state}${l.zip ? ` ${l.zip}` : ""}`;
}

/** "Florida", "Florida and New York", "Florida, New York and Texas". */
export function listJoin(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** States they hold a verified license in, as full names. */
export function licensedStates(p: ProfileView) {
  return Array.from(new Set((p.licenses ?? []).filter((l) => l.verified !== false).map((l) => stateName(l.state))));
}

/** Lowest fee they list (the card's "From 120 USD"). */
export function feeFrom(p: ProfileView) {
  const fees = [p.feeIndividual, p.feeCouples].filter((f): f is number => f != null);
  return fees.length ? Math.min(...fees) : null;
}

export function initials(p: ProfileView) {
  return displayName(p)
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
