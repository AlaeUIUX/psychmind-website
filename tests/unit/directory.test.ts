import { describe, expect, it } from "vitest";
import { feeFrom, licensedStates, listJoin, locationLabel, therapyType } from "@/lib/provider/display";
import { parseProfileRef, profilePath, profileSlug } from "@/lib/provider/links";
import { safeNext } from "@/lib/safe-next";

describe("profile links", () => {
  it("puts the name and the public id in the path", () => {
    expect(profilePath({ firstName: "Sara", lastName: "Oliisi", publicId: "ab3k9mzp" })).toBe("/providers/sara-oliisi-ab3k9mzp");
    expect(profilePath({ firstName: "José", lastName: "Núñez-Ruiz", publicId: "ab3k9mzp" })).toBe("/providers/jose-nunez-ruiz-ab3k9mzp");
    expect(profilePath({ businessName: "Calm Harbor Therapy", displayAsBusiness: true, firstName: "A", publicId: "ab3k9mzp" })).toBe(
      "/providers/calm-harbor-therapy-ab3k9mzp",
    );
    expect(profilePath({ publicId: "ab3k9mzp" })).toBe("/providers/ab3k9mzp");
    expect(profileSlug({ firstName: "  " })).toBe("");
  });

  it("reads the public id from the end, whatever the name says", () => {
    expect(parseProfileRef("sara-oliisi-ab3k9mzp")).toBe("ab3k9mzp");
    expect(parseProfileRef("old-name-ab3k9mzp")).toBe("ab3k9mzp");
    expect(parseProfileRef("ab3k9mzp")).toBe("ab3k9mzp");
    expect(parseProfileRef("sara-oliisi")).toBeNull();
    expect(parseProfileRef("sara-AB3K9MZP")).toBeNull();
    expect(parseProfileRef("x-ab3k9mzp'--")).toBeNull();
    expect(parseProfileRef("%E0%A4%A-ab3k9mzp")).toBe("ab3k9mzp");
  });
});

describe("safeNext", () => {
  it("allows paths on this site", () => {
    expect(safeNext("/providers/sara-oliisi-ab3k9mzp?save=1")).toBe("/providers/sara-oliisi-ab3k9mzp?save=1");
    expect(safeNext("/account")).toBe("/account");
  });

  it("refuses other sites and tricks that browsers turn into them", () => {
    for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "/\t/evil.test", "/\n/evil.test", "evil.test", "", null, 42]) {
      expect(safeNext(bad)).toBeNull();
    }
  });
});

describe("display helpers", () => {
  it("joins lists the way the copy reads", () => {
    expect(listJoin([])).toBe("");
    expect(listJoin(["Florida"])).toBe("Florida");
    expect(listJoin(["Florida", "New York"])).toBe("Florida and New York");
    expect(listJoin(["Florida", "New York", "Texas"])).toBe("Florida, New York and Texas");
  });

  it("names the therapy type like Figma's cards", () => {
    expect(therapyType(["individuals"])).toBe("Individual one-on-one therapy");
    expect(therapyType(["individuals", "groups"])).toBe("Individual & Group therapy");
    expect(therapyType([])).toBeNull();
  });

  it("shows the in-person location, or Online", () => {
    const online = { state: "FL", city: "Miami", formats: ["online"], isPrimary: true };
    const office = { state: "NY", city: "Brooklyn", zip: "11201", formats: ["in_person"], isPrimary: false };
    expect(locationLabel({ locations: [online] })).toBe("Online");
    expect(locationLabel({ locations: [online, office] })).toBe("Brooklyn, NY 11201");
    expect(locationLabel({})).toBeNull();
  });

  it("lists verified license states and the lowest fee", () => {
    const licenses = [
      { state: "FL", licenseNumber: "1", verified: true },
      { state: "NY", licenseNumber: "2", verified: false },
    ];
    expect(licensedStates({ licenses })).toEqual(["Florida"]);
    expect(feeFrom({ feeIndividual: 160, feeCouples: 120 })).toBe(120);
    expect(feeFrom({})).toBeNull();
  });
});
