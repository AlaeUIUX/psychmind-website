import { afterEach, describe, expect, it, vi } from "vitest";
import { isZip, parseZipResponse } from "@/lib/zip";
import { lookupZip } from "@/server/zip";

// ZIP → city and state for the practice address step: optional help that
// must never get in the way when the lookup service is slow or down.

describe("parseZipResponse", () => {
  it("reads Zippopotam's places", () => {
    expect(
      parseZipResponse({ places: [{ "place name": "Austin", "state abbreviation": "TX", state: "Texas" }] }),
    ).toEqual([{ city: "Austin", state: "TX" }]);
  });

  it("drops duplicates and caps the list", () => {
    const places = Array.from({ length: 8 }, (_, i) => ({ "place name": `Town ${i % 6}`, "state abbreviation": "ny" }));
    expect(parseZipResponse({ places })).toHaveLength(5);
  });

  it("refuses anything that isn't a list of places", () => {
    expect(parseZipResponse(null)).toBeNull();
    expect(parseZipResponse({})).toBeNull();
    expect(parseZipResponse({ places: [{ "place name": "", "state abbreviation": "TX" }] })).toBeNull();
    expect(parseZipResponse({ places: [{ "place name": "Somewhere", "state abbreviation": "Texas" }] })).toBeNull();
  });

  it("only five digits count as a ZIP", () => {
    expect(isZip("78701")).toBe(true);
    expect(isZip("7870")).toBe(false);
    expect(isZip("78701-1234")).toBe(false);
    expect(isZip("abcde")).toBe(false);
  });
});

describe("lookupZip", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("finds a known ZIP", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ places: [{ "place name": "Beverly Hills", "state abbreviation": "CA" }] })));
    expect(await lookupZip("90210")).toEqual({ status: "found", places: [{ city: "Beverly Hills", state: "CA" }] });
  });

  it("says not found for an unknown ZIP", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    expect(await lookupZip("00001")).toEqual({ status: "not_found" });
  });

  it("gives up quietly when the service fails, so the fields stay manual", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 500 })));
    expect(await lookupZip("10002")).toEqual({ status: "unavailable" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await lookupZip("10003")).toEqual({ status: "unavailable" });
  });

  it("never calls out for something that isn't a ZIP", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await lookupZip("12")).toEqual({ status: "not_found" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
