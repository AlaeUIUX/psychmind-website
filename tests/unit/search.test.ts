import { describe, expect, it } from "vitest";
import { searchDirectory } from "@/lib/search/engine";
import { EMPTY_FILTERS, loadSearchFilters, type SearchFilters } from "@/lib/search/filters";
import { closeness, parsePlace, stateForZip } from "@/lib/search/location";
import { parseQuery } from "@/lib/search/text";
import type { DirectoryProvider } from "@/server/directory/data";

const both = ["online", "in_person"];

function provider(id: string, over: Partial<DirectoryProvider>): DirectoryProvider {
  return {
    id,
    publicId: id.padEnd(8, "x"),
    href: `/providers/${id}`,
    firstName: id,
    lastName: "Test",
    titleCredentials: "LMHC",
    specialties: [],
    approaches: [],
    languages: ["English"],
    ageGroups: ["adults"],
    sessionParticipants: ["individuals"],
    acceptingNewClients: true,
    verified: true,
    locations: [],
    licenses: [],
    ...over,
  };
}

const sara = provider("sara", {
  gender: "female",
  specialties: ["anxiety", "trauma_ptsd"],
  primarySpecialty: "anxiety",
  approaches: ["cbt"],
  languages: ["English", "French"],
  feeIndividual: 120,
  about: "I help adults through panic and big life changes.",
  locations: [{ state: "FL", city: "Miami", zip: "33131", formats: both, isPrimary: true }],
  licenses: [{ state: "FL", licenseNumber: "1", verified: true }],
});
const omar = provider("omar", {
  gender: "male",
  specialties: ["depression"],
  approaches: ["psychodynamic"],
  languages: ["English", "Arabic"],
  feeIndividual: 200,
  locations: [{ state: "NY", city: "Brooklyn", zip: "11201", formats: ["online"], isPrimary: true }],
  licenses: [
    { state: "NY", licenseNumber: "2", verified: true },
    { state: "NJ", licenseNumber: "3", verified: true },
  ],
});
const lena = provider("lena", {
  gender: "female",
  specialties: ["trauma_ptsd", "grief_loss"],
  approaches: ["emdr"],
  languages: ["English", "Spanish"],
  feeIndividual: 90,
  slidingScale: true,
  ageGroups: ["teens", "adults"],
  locations: [{ state: "FL", city: "Orlando", zip: "32801", formats: ["in_person"], isPrimary: true }],
  licenses: [{ state: "FL", licenseNumber: "4", verified: true }],
});
const sample = provider("sample", {
  isSample: true,
  specialties: ["anxiety"],
  feeIndividual: 100,
  locations: [{ state: "FL", city: "Miami", zip: "33130", formats: both, isPrimary: true }],
  licenses: [{ state: "FL", licenseNumber: "5", verified: true }],
});
const all = [sample, sara, omar, lena];

const search = (over: Partial<SearchFilters>) => searchDirectory(all, { ...EMPTY_FILTERS, ...over });
const names = (r: { provider: DirectoryProvider }[]) => r.map((x) => x.provider.id);

describe("where", () => {
  it("reads cities, ZIPs and states", () => {
    expect(parsePlace("Miami, FL 33130")).toMatchObject({ city: "Miami", state: "FL", zip: "33130", label: "Miami, FL 33130" });
    expect(parsePlace("33131")).toMatchObject({ zip: "33131", state: "FL" });
    expect(parsePlace("florida")).toMatchObject({ state: "FL", label: "Florida" });
    expect(parsePlace("brooklyn ny")).toMatchObject({ city: "Brooklyn", state: "NY" });
    expect(parsePlace("  ")).toBeNull();
    expect(stateForZip("10001")).toBe("NY");
    expect(stateForZip("94110")).toBe("CA");
  });

  it("ranks the same ZIP, then city, then ZIP area, then state", () => {
    const miami = { state: "FL", city: "Miami", zip: "33131" };
    expect(closeness(parsePlace("33131")!, miami)).toBe(4);
    expect(closeness(parsePlace("Miami, FL")!, miami)).toBe(3);
    expect(closeness(parsePlace("33139")!, miami)).toBe(2);
    expect(closeness(parsePlace("Florida")!, miami)).toBe(1);
    expect(closeness(parsePlace("Austin, TX")!, miami)).toBe(0);
  });
});

describe("searchDirectory", () => {
  it("lists real providers before samples", () => {
    expect(names(search({}).results)).toEqual(["sara", "omar", "lena", "sample"]);
  });

  it("in-person keeps practices in the area, nearest first", () => {
    const r = search({ format: "in_person", where: "Miami, FL" });
    expect(names(r.results)).toEqual(["sara", "lena", "sample"]);
    expect(r.results[0].where).toBe("Miami, FL");
    expect(search({ format: "in_person" }).needs).toBe("place");
  });

  it("online needs a license in the patient's state", () => {
    expect(names(search({ format: "online", where: "NJ" }).results)).toEqual(["omar"]);
    expect(names(search({ format: "online", where: "Florida" }).results)).toEqual(["sara", "sample"]);
    expect(search({ format: "online" }).needs).toBe("state");
    expect(search({ format: "online", where: "Texas" }).results).toHaveLength(0);
  });

  it("matches any value within a filter and every filter together", () => {
    expect(names(search({ specialty: ["depression", "grief_loss"] }).results)).toEqual(["omar", "lena"]);
    expect(names(search({ specialty: ["trauma_ptsd"], gender: ["female"], language: ["Spanish"] }).results)).toEqual(["lena"]);
    expect(names(search({ max: 100 }).results)).toEqual(["lena", "sample"]);
    expect(names(search({ sliding: true }).results)).toEqual(["lena"]);
  });

  it("understands everyday words", () => {
    expect(parseQuery("I need help with PTSD")?.specialties).toEqual(["trauma_ptsd"]);
    const r = search({ q: "panic attacks" });
    expect(names(r.results)).toEqual(["sara", "sample"]);
    expect(r.results[0].matched).toContain("anxiety");
  });

  it("counts each option with the other filters applied", () => {
    const r = search({ gender: ["female"] });
    expect(r.facets.gender).toEqual({ female: 2, male: 1 });
    expect(r.facets.specialty.trauma_ptsd).toBe(2);
    expect(r.facets.specialty.depression).toBeUndefined();
  });

  it("offers close matches labelled with what they miss, never outside the area", () => {
    const r = search({ format: "in_person", where: "FL", language: ["Arabic"] });
    expect(r.results).toHaveLength(0);
    expect(names(r.close)).toEqual(["sara", "lena", "sample"]);
    expect(r.close[0].misses).toEqual(["Doesn't speak Arabic"]);
    expect(names(r.recommended)).toHaveLength(3);
  });

  it("sorts by price and experience", () => {
    expect(names(search({ sort: "price_asc" }).results)).toEqual(["lena", "sara", "omar", "sample"]);
    expect(names(search({ sort: "price_desc" }).results)).toEqual(["omar", "sara", "lena", "sample"]);
  });
});

describe("loadSearchFilters", () => {
  it("parses the URL and caps what it's given", () => {
    const f = loadSearchFilters({ format: "online", specialty: "anxiety,depression", min: "-5", q: "x".repeat(500), sort: "nope" });
    expect(f.format).toBe("online");
    expect(f.specialty).toEqual(["anxiety", "depression"]);
    expect(f.min).toBeNull();
    expect(f.q).toHaveLength(120);
    expect(f.sort).toBe("best");
  });
});
