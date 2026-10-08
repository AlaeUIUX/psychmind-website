import { describe, expect, it } from "vitest";
import {
  credentialsSchema,
  expertiseSchema,
  identitySchema,
  locationsSchema,
  practiceSchema,
  storySchema,
} from "@/lib/provider/schema";

const location = (over: object = {}) => ({
  state: "TX",
  city: "Austin",
  zip: "",
  practiceName: "",
  address: "",
  formats: ["online"],
  isPrimary: true,
  ...over,
});

describe("provider profile schemas", () => {
  it("requires name and title, trims whitespace", () => {
    const r = identitySchema.safeParse({
      firstName: "  Sara ",
      lastName: "",
      titleCredentials: "LMHC",
      pronouns: "",
      bannerStyle: "banner_04",
      businessName: "",
      displayAsBusiness: false,
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join("."))).toEqual(["lastName"]);
  });

  it("limits the story to 1600 words (Figma)", () => {
    const long = Array.from({ length: 1601 }, () => "word").join(" ");
    expect(storySchema.safeParse({ whoYouWorkWith: long, about: "ok" }).success).toBe(false);
    expect(storySchema.safeParse({ whoYouWorkWith: "ok", about: "ok" }).success).toBe(true);
  });

  it("requires the main specialty to be one of the specialties, dedupes custom chips", () => {
    const bad = expertiseSchema.safeParse({
      specialties: ["anxiety"],
      primarySpecialty: "depression",
      approaches: ["cbt"],
      languages: ["English"],
    });
    expect(bad.error?.issues[0].path).toEqual(["primarySpecialty"]);
    const ok = expertiseSchema.parse({
      specialties: ["anxiety", "anxiety", "Perinatal mental health"],
      primarySpecialty: "anxiety",
      approaches: ["cbt"],
      languages: ["English"],
    });
    expect(ok.specialties).toEqual(["anxiety", "Perinatal mental health"]);
  });

  it("turns empty fee fields into null and rejects decimals", () => {
    const base = { gender: "", slidingScale: false, acceptingNewClients: true, education: [] };
    expect(practiceSchema.parse({ ...base, feeIndividual: "", feeCouples: "160" })).toMatchObject({
      feeIndividual: null,
      feeCouples: 160,
      gender: null,
    });
    expect(practiceSchema.safeParse({ ...base, feeIndividual: "99.5", feeCouples: "" }).success).toBe(false);
  });

  it("needs exactly one primary location and unique states", () => {
    expect(locationsSchema.safeParse({ locations: [location(), location({ state: "NY", isPrimary: false })] }).success).toBe(true);
    expect(locationsSchema.safeParse({ locations: [location(), location({ isPrimary: false })] }).success).toBe(false);
    expect(locationsSchema.safeParse({ locations: [location(), location({ state: "NY" })] }).success).toBe(false);
    expect(locationsSchema.safeParse({ locations: [location({ zip: "123" })] }).success).toBe(false);
  });

  it("validates the NPI as 10 digits and requires a document per license", () => {
    const license = { state: "TX", licenseNumber: "LPC-1", issuingBody: "Texas BHEC", documentId: "doc" };
    expect(credentialsSchema.safeParse({ npiNumber: "1234567890", yearsExperience: "", licenses: [license] }).success).toBe(true);
    expect(credentialsSchema.safeParse({ npiNumber: "12345", yearsExperience: "", licenses: [license] }).success).toBe(false);
    expect(
      credentialsSchema.safeParse({ npiNumber: "1234567890", yearsExperience: "", licenses: [{ ...license, documentId: "" }] }).success,
    ).toBe(false);
  });
});
