import { feeFrom, listJoin } from "@/lib/provider/display";
import { AGE_GROUPS, labelOf, stateName } from "@/lib/taxonomy";
import type { DirectoryProvider } from "@/server/directory/data";
import type { SearchFilters } from "./filters";
import { closeness, parsePlace, type Place } from "./location";
import { parseQuery, type TextQuery } from "./text";

// The directory search. Pure: listed providers + filters in, ranked results
// out, so it's fast to test and easy to move into the database later.
//
// - Within a filter, any chosen value matches (Anxiety OR Depression); across
//   filters, all must match. Counts next to each option show how many
//   providers it would give, with the other filters applied.
// - Location is never relaxed: in-person means a practice near the place;
//   online means licensed in the patient's state.
// - Fewer than 10 matches: providers who miss exactly one other filter are
//   offered as close matches, labelled with what they miss.

export type Group = "where" | "q" | "specialty" | "approach" | "gender" | "language" | "age" | "price" | "sliding";

export type Ranked = {
  provider: DirectoryProvider;
  /** Specialties that match the search, shown first and highlighted. */
  matched: string[];
  /** Close matches only: what doesn't match. TODO(client): copy. */
  misses?: string[];
  /** Where they'd see this patient, when a place was given ("Miami, FL", "Online in Florida"). */
  where?: string;
};

export type Facets = Record<"specialty" | "approach" | "gender" | "language" | "age" | "format", Record<string, number>>;

export type SearchResult = {
  results: Ranked[];
  close: Ranked[];
  /** Shown when nothing matches. */
  recommended: Ranked[];
  facets: Facets;
  /** Lowest and highest session price across the directory. */
  price: { min: number; max: number };
  place: Place | null;
  query: TextQuery | null;
  /** A location the chosen format needs before we can apply it. */
  needs?: "state" | "place";
};

type Evaluated = {
  provider: DirectoryProvider;
  index: number;
  fails: Group[];
  score: number;
  matched: string[];
  where?: string;
  /** Location fit if the format were in-person / online (for format counts). */
  fits: { in_person: boolean; online: boolean };
};

const RELAXABLE: Group[] = ["q", "specialty", "approach", "gender", "language", "age", "price", "sliding"];
const CLOSE_WHEN_FEWER_THAN = 10;

function searchableText(p: DirectoryProvider) {
  return ` ${[
    p.firstName,
    p.lastName,
    p.businessName,
    p.titleCredentials,
    p.whoYouWorkWith,
    p.about,
    ...(p.specialties ?? []).map((s) => labelOf("specialties", s)),
    ...(p.approaches ?? []).map((a) => labelOf("approaches", a)),
    ...(p.languages ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")} `;
}

type Fit = { ok: boolean; closeness: number; where?: string };

function locationFit(p: DirectoryProvider, format: SearchFilters["format"], place: Place | null): Fit {
  const locations = p.locations ?? [];
  const inPerson = locations.filter((l) => l.formats.includes("in_person"));
  const offersOnline = locations.some((l) => l.formats.includes("online"));
  const licensed = new Set((p.licenses ?? []).filter((l) => l.verified !== false).map((l) => l.state));

  const nearest = () => {
    let best = 0;
    let label: string | undefined;
    for (const l of inPerson) {
      const c = place ? closeness(place, l) : 0;
      if (c > best) {
        best = c;
        label = `${l.city}, ${l.state}`;
      }
    }
    return { best, label };
  };
  const onlineHere = () => offersOnline && !!place?.state && licensed.has(place.state);

  if (format === "in_person") {
    if (!inPerson.length) return { ok: false, closeness: 0 };
    if (!place) return { ok: true, closeness: 0 };
    const { best, label } = nearest();
    return best > 0 ? { ok: true, closeness: best, where: label } : { ok: false, closeness: 0 };
  }
  if (format === "online") {
    if (!offersOnline) return { ok: false, closeness: 0 };
    if (!place?.state) return { ok: true, closeness: 0 };
    return onlineHere() ? { ok: true, closeness: 1, where: `Online in ${stateName(place.state)}` } : { ok: false, closeness: 0 };
  }
  if (!place) return { ok: true, closeness: 0 };
  const { best, label } = nearest();
  if (best > 0) return { ok: true, closeness: best, where: label };
  if (onlineHere()) return { ok: true, closeness: 0.5, where: `Online in ${stateName(place.state!)}` };
  return { ok: false, closeness: 0 };
}

function inPrice(fee: number | null, f: SearchFilters) {
  if (f.min == null && f.max == null) return true;
  if (fee == null) return false;
  return (f.min == null || fee >= f.min) && (f.max == null || fee <= f.max);
}

function evaluate(p: DirectoryProvider, index: number, f: SearchFilters, place: Place | null, query: TextQuery | null): Evaluated {
  const fails: Group[] = [];
  let score = 0;
  const specialties = p.specialties ?? [];
  const approaches = p.approaches ?? [];

  const fit = locationFit(p, f.format, place);
  if (!fit.ok) fails.push("where");
  score += fit.closeness * 10;

  // What's on your mind?
  const wanted = new Set([...f.specialty, ...(query?.specialties ?? [])]);
  if (query) {
    const text = searchableText(p);
    const specialtyHits = query.specialties.filter((s) => specialties.includes(s)).length;
    const approachHits = query.approaches.filter((a) => approaches.includes(a)).length;
    const textHits = query.words.filter((w) => text.includes(` ${w}`)).length;
    if (!specialtyHits && !approachHits && !textHits) fails.push("q");
    score += specialtyHits * 4 + approachHits * 2 + Math.min(textHits, 5);
  }

  const anyOf = (chosen: string[], has: string[], group: Group, weight: number) => {
    if (!chosen.length) return;
    const hits = chosen.filter((v) => has.includes(v)).length;
    if (!hits) fails.push(group);
    score += hits * weight;
  };
  anyOf(f.specialty, specialties, "specialty", 4);
  anyOf(f.approach, approaches, "approach", 2);
  anyOf(f.gender, p.gender ? [p.gender] : [], "gender", 1);
  anyOf(f.language, p.languages ?? [], "language", 1);
  anyOf(f.age, p.ageGroups ?? [], "age", 1);
  if (!inPrice(feeFrom(p), f)) fails.push("price");
  if (f.sliding && !p.slidingScale) fails.push("sliding");

  if (p.primarySpecialty && wanted.has(p.primarySpecialty)) score += 2;
  if (p.acceptingNewClients !== false) score += 3;

  return {
    provider: p,
    index,
    fails,
    score,
    matched: specialties.filter((s) => wanted.has(s)),
    where: fit.where,
    fits: { in_person: locationFit(p, "in_person", place).ok, online: locationFit(p, "online", place).ok },
  };
}

function missLabel(group: Group, e: Evaluated, f: SearchFilters, query: TextQuery | null): string {
  const p = e.provider;
  const names = (kind: "specialties" | "approaches", values: string[]) => listJoin(values.map((v) => labelOf(kind, v))).replace(/ and ([^,]*)$/, " or $1");
  switch (group) {
    case "q":
      return `Doesn't mention “${f.q.trim()}”`;
    case "specialty":
      return `Doesn't list ${names("specialties", f.specialty)}`;
    case "approach":
      return `Doesn't use ${names("approaches", f.approach)}`;
    case "gender":
      return "Different gender";
    case "language":
      return `Doesn't speak ${listJoin(f.language).replace(/ and ([^,]*)$/, " or $1")}`;
    case "age": {
      const ages = f.age.map((a) => AGE_GROUPS.find((g) => g.value === a)?.label.toLowerCase().replace(" +18", "") ?? a);
      return `Doesn't see ${listJoin(ages).replace(/ and ([^,]*)$/, " or $1")}`;
    }
    case "price": {
      const fee = feeFrom(p);
      if (fee == null) return "No session fee listed";
      return f.max != null && fee > f.max ? `Above your budget (from ${fee} USD)` : "Below your price range";
    }
    case "sliding":
      return "No sliding scale";
    default:
      return query ? "Doesn't match your search" : "Doesn't match";
  }
}

function rank(list: Evaluated[], sort: SearchFilters["sort"]) {
  const fee = (e: Evaluated) => feeFrom(e.provider);
  return [...list].sort((a, b) => {
    // Real providers always come before the sample profiles.
    const sample = Number(!!a.provider.isSample) - Number(!!b.provider.isSample);
    if (sample) return sample;
    if (sort === "price_asc" || sort === "price_desc") {
      const fa = fee(a);
      const fb = fee(b);
      if (fa == null || fb == null) return fa == null && fb == null ? a.index - b.index : fa == null ? 1 : -1;
      if (fa !== fb) return sort === "price_asc" ? fa - fb : fb - fa;
    } else if (sort === "experience") {
      const d = (b.provider.yearsExperience ?? -1) - (a.provider.yearsExperience ?? -1);
      if (d) return d;
    } else if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });
}

const toRanked = (e: Evaluated, misses?: string[]): Ranked => ({ provider: e.provider, matched: e.matched, where: e.where, misses });

function countFacets(all: Evaluated[]): Facets {
  const facets: Facets = { specialty: {}, approach: {}, gender: {}, language: {}, age: {}, format: {} };
  const add = (bucket: Record<string, number>, values: (string | null | undefined)[]) => {
    for (const v of new Set(values)) if (v) bucket[v] = (bucket[v] ?? 0) + 1;
  };
  for (const e of all) {
    const p = e.provider;
    const passesExcept = (group: Group) => e.fails.every((g) => g === group);
    if (passesExcept("specialty")) add(facets.specialty, p.specialties ?? []);
    if (passesExcept("approach")) add(facets.approach, p.approaches ?? []);
    if (passesExcept("gender")) add(facets.gender, [p.gender]);
    if (passesExcept("language")) add(facets.language, p.languages ?? []);
    if (passesExcept("age")) add(facets.age, p.ageGroups ?? []);
    if (passesExcept("where")) {
      if (e.fits.in_person) facets.format.in_person = (facets.format.in_person ?? 0) + 1;
      if (e.fits.online) facets.format.online = (facets.format.online ?? 0) + 1;
    }
  }
  return facets;
}

export function searchDirectory(providers: DirectoryProvider[], f: SearchFilters): SearchResult {
  const place = parsePlace(f.where);
  const query = parseQuery(f.q);
  const all = providers.map((p, i) => evaluate(p, i, f, place, query));

  const exact = rank(
    all.filter((e) => !e.fails.length),
    f.sort,
  );
  const relaxing = RELAXABLE.some((g) => all.some((e) => e.fails.includes(g)));
  const close =
    exact.length < CLOSE_WHEN_FEWER_THAN && relaxing
      ? rank(
          all.filter((e) => e.fails.length === 1 && e.fails[0] !== "where"),
          f.sort,
        )
          .slice(0, CLOSE_WHEN_FEWER_THAN)
          .map((e) => toRanked(e, e.fails.map((g) => missLabel(g, e, f, query))))
      : [];

  const fees = providers.map(feeFrom).filter((x): x is number => x != null);
  const recommended = exact.length ? [] : rank(all, "best").slice(0, 3).map((e) => toRanked(e));

  return {
    results: exact.map((e) => toRanked(e)),
    close,
    recommended,
    facets: countFacets(all),
    price: {
      min: fees.length ? Math.floor(Math.min(...fees) / 10) * 10 : 0,
      max: fees.length ? Math.ceil(Math.max(...fees) / 10) * 10 : 500,
    },
    place,
    query,
    needs: f.format === "online" && !place?.state ? "state" : f.format === "in_person" && !place ? "place" : undefined,
  };
}
