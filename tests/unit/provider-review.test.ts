import { describe, expect, it } from "vitest";
import { hasPending, mergePending, sameLicense, showValue } from "@/lib/provider/review";

// What a verified provider's edit holds for review (lib/provider/review.ts).

const verified = {
  firstName: "Maya",
  lastName: "Ellison",
  titleCredentials: "LMFT",
  businessName: "",
  displayAsBusiness: false,
  npiNumber: "1234567893",
};

describe("pending changes", () => {
  it("holds a reviewed field that differs from the verified value", () => {
    expect(mergePending(verified, null, { ...verified, lastName: "Ellison-Grant" })).toEqual({ lastName: "Ellison-Grant" });
  });

  it("holds nothing when the requested values are the verified ones (spaces and empty text included)", () => {
    expect(mergePending(verified, null, { ...verified, firstName: " Maya ", businessName: "" })).toEqual({});
    expect(hasPending(mergePending(verified, null, verified))).toBe(false);
  });

  it("drops a field set back to its verified value, and keeps other pending fields", () => {
    const pending = { lastName: "Ellison-Grant", npiNumber: "1987654320" };
    // The identity step sends its fields; the NPI belongs to another step and stays pending.
    expect(mergePending(verified, pending, { firstName: "Maya", lastName: "Ellison", titleCredentials: "LMFT" })).toEqual({
      npiNumber: "1987654320",
    });
  });

  it("holds a changed flag", () => {
    expect(mergePending(verified, null, { displayAsBusiness: true })).toEqual({ displayAsBusiness: true });
  });
});

describe("licenses", () => {
  const license = { licenseNumber: "LMFT 1234", issuingBody: "Texas BHEC", documentId: "doc-1" };

  it("compares number, board and document", () => {
    expect(sameLicense(license, { ...license, licenseNumber: " LMFT 1234 " })).toBe(true);
    expect(sameLicense(license, { ...license, documentId: "doc-2" })).toBe(false);
    expect(sameLicense(license, { ...license, issuingBody: "Texas BBHE" })).toBe(false);
  });
});

describe("how values read", () => {
  it("shows flags as Yes / No and missing text as a dash", () => {
    expect(showValue(true)).toBe("Yes");
    expect(showValue(false)).toBe("No");
    expect(showValue("")).toBe("—");
    expect(showValue(" LMFT ")).toBe("LMFT");
  });
});
