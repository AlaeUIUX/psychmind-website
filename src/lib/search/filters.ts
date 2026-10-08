import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";

// Search filters live in the URL (/providers?format=online&where=FL&specialty=anxiety),
// so a search can be shared and Back works (build plan, slice 8). The same
// parsers read them on the server and write them in the browser.

export const FORMATS = ["in_person", "online"] as const;
export const SORTS = ["best", "price_asc", "price_desc", "experience"] as const;
export type Format = (typeof FORMATS)[number];
export type Sort = (typeof SORTS)[number];

const list = parseAsArrayOf(parseAsString).withDefault([]);

export const searchParsers = {
  /** Session format; none = either. */
  format: parseAsStringLiteral(FORMATS),
  /** "Where?": city, ZIP or state. Online sessions only use the state. */
  where: parseAsString.withDefault(""),
  /** "What's on your mind?" */
  q: parseAsString.withDefault(""),
  specialty: list,
  approach: list,
  gender: list,
  language: list,
  age: list,
  /** Price per session range, USD. */
  min: parseAsInteger,
  max: parseAsInteger,
  sliding: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(SORTS).withDefault("best"),
};

export type SearchFilters = inferParserType<typeof searchParsers>;

/** Filters from a page's searchParams (never trusts their size). */
export function loadSearchFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const raw = createLoader(searchParsers)(params);
  const clip = (values: string[]) => values.filter(Boolean).slice(0, 20).map((v) => v.slice(0, 60));
  return {
    ...raw,
    where: raw.where.slice(0, 80),
    q: raw.q.slice(0, 120),
    specialty: clip(raw.specialty),
    approach: clip(raw.approach),
    gender: clip(raw.gender),
    language: clip(raw.language),
    age: clip(raw.age),
    min: raw.min != null && raw.min >= 0 ? Math.min(raw.min, 100_000) : null,
    max: raw.max != null && raw.max >= 0 ? Math.min(raw.max, 100_000) : null,
  };
}

/** A /providers link for a set of filters. */
export const searchHref = createSerializer(searchParsers);

/** The filters a person chose (everything except sort). */
export function activeFilterCount(f: SearchFilters) {
  return (
    (f.format ? 1 : 0) +
    (f.where ? 1 : 0) +
    (f.q ? 1 : 0) +
    f.specialty.length +
    f.approach.length +
    f.gender.length +
    f.language.length +
    f.age.length +
    (f.min != null || f.max != null ? 1 : 0) +
    (f.sliding ? 1 : 0)
  );
}

export const EMPTY_FILTERS: SearchFilters = {
  format: null,
  where: "",
  q: "",
  specialty: [],
  approach: [],
  gender: [],
  language: [],
  age: [],
  min: null,
  max: null,
  sliding: false,
  sort: "best",
};
