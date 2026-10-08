import { US_STATES } from "@/lib/taxonomy";

// "Where?" in search: what a patient types ("Miami, FL", "33131", "Florida")
// turned into a city, ZIP and state. Online sessions only need the state
// (providers can only see clients where they're licensed); in-person sessions
// use the rest to rank providers close by. No geocoding service yet, so
// "close" means same ZIP, then same city, then the same ZIP area (first three
// digits), then the same state.

export type Place = {
  zip?: string;
  city?: string;
  /** Two-letter state code. */
  state?: string;
  /** How we show it back: "Miami, FL 33131", "Florida". */
  label: string;
};

// First three ZIP digits → state (USPS ranges; territories and military left out).
const ZIP3: [from: number, to: number, state: string][] = [
  [5, 5, "NY"], [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"], [50, 54, "VT"], [55, 55, "MA"],
  [56, 59, "VT"], [60, 69, "CT"], [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"], [197, 199, "DE"],
  [200, 200, "DC"], [201, 201, "VA"], [202, 205, "DC"], [206, 219, "MD"], [220, 246, "VA"], [247, 268, "WV"],
  [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"], [320, 349, "FL"], [350, 369, "AL"], [370, 385, "TN"],
  [386, 397, "MS"], [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"], [460, 479, "IN"], [480, 499, "MI"],
  [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [570, 577, "SD"], [580, 588, "ND"], [590, 599, "MT"],
  [600, 629, "IL"], [630, 658, "MO"], [660, 679, "KS"], [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"],
  [730, 749, "OK"], [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"], [832, 838, "ID"], [840, 847, "UT"],
  [850, 865, "AZ"], [870, 884, "NM"], [885, 885, "TX"], [889, 898, "NV"], [900, 961, "CA"], [967, 968, "HI"],
  [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

export function stateForZip(zip: string): string | undefined {
  const prefix = Number(zip.slice(0, 3));
  if (!/^\d{5}$/.test(zip) || Number.isNaN(prefix)) return undefined;
  return ZIP3.find(([from, to]) => prefix >= from && prefix <= to)?.[2];
}

const BY_CODE = new Map(US_STATES.map((s) => [s.value, s.label]));
const BY_NAME = new Map(US_STATES.map((s) => [s.label.toLowerCase(), s.value]));

/** "fl", "Florida", "FLORIDA" → "FL". */
export function stateCode(text: string): string | undefined {
  const t = text.trim();
  if (/^[a-z]{2}$/i.test(t) && BY_CODE.has(t.toUpperCase())) return t.toUpperCase();
  return BY_NAME.get(t.toLowerCase());
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());

/** Reads what someone typed in "Where?". Unknown text is treated as a city. */
export function parsePlace(input: string | null | undefined): Place | null {
  const text = (input ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!text) return null;

  const zip = text.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  const rest = text.replace(/\b\d{5}(?:-\d{4})?\b/, "").replace(/[\s,]+$/, "").trim();

  let city: string | undefined;
  let state: string | undefined;
  if (rest) {
    const parts = rest.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      state = stateCode(parts.at(-1)!);
      city = state ? parts.slice(0, -1).join(", ") : parts.join(", ");
    } else {
      // "Florida", "FL", "Miami FL", or just "Miami".
      state = stateCode(rest);
      if (!state) {
        const words = rest.split(" ");
        const last = words.at(-1)!;
        const tail = words.length > 1 && /^[a-z]{2}$/i.test(last) ? stateCode(last) : undefined;
        if (tail) {
          state = tail;
          city = words.slice(0, -1).join(" ");
        } else {
          city = rest;
        }
      }
    }
  }
  if (zip && !state) state = stateForZip(zip);
  city = city ? titleCase(city) : undefined;

  const label = city
    ? `${city}${state ? `, ${state}` : ""}${zip ? ` ${zip}` : ""}`
    : zip
      ? `${zip}${state ? ` (${state})` : ""}`
      : state
        ? (BY_CODE.get(state) ?? state)
        : text;
  return { zip, city, state, label };
}

type Located = { state: string; city: string; zip?: string | null };

/** How close a practice location is to the place: 4 same ZIP, 3 same city,
 *  2 same ZIP area, 1 same state, 0 elsewhere. */
export function closeness(place: Place, location: Located): number {
  const sameState = !place.state || place.state === location.state;
  if (place.zip && location.zip === place.zip) return 4;
  if (place.city && sameState && location.city.toLowerCase() === place.city.toLowerCase()) return 3;
  if (place.zip && location.zip && location.zip.slice(0, 3) === place.zip.slice(0, 3)) return 2;
  if (place.state && location.state === place.state) return 1;
  return 0;
}
