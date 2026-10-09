import { describe, expect, it } from "vitest";
import { batchSchema, termLabel } from "@/lib/analytics/events";
import { conversionRate, formatChange, formatCount, formatPercent, rateChange, shortPersonName } from "@/lib/analytics/format";
import { addDays, dayOf, daysBetween, eachDay, isDay, parseRange, rangeLabel, rangeQuery } from "@/lib/analytics/range";

describe("analytics days", () => {
  it("counts days in New York, not UTC", () => {
    // 01:30 UTC on Oct 10 is still the evening of Oct 9 in New York.
    expect(dayOf(new Date("2026-10-10T01:30:00Z"))).toBe("2026-10-09");
    expect(dayOf(new Date("2026-10-10T05:00:00Z"))).toBe("2026-10-10");
  });

  it("does calendar arithmetic across months, years and leap days", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-10-03", "2026-10-09")).toBe(7);
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("only accepts real dates", () => {
    expect(isDay("2026-10-09")).toBe(true);
    expect(isDay("2026-02-30")).toBe(false);
    expect(isDay("2026-1-9")).toBe(false);
    expect(isDay("2026-10-09'; drop table")).toBe(false);
    expect(isDay(undefined)).toBe(false);
  });
});

describe("parseRange", () => {
  const today = "2026-10-09";

  it("defaults to the last 7 days, today included, against the 7 before", () => {
    expect(parseRange({}, today)).toEqual({
      preset: "7d",
      from: "2026-10-03",
      to: "2026-10-09",
      days: 7,
      prevFrom: "2026-09-26",
      prevTo: "2026-10-02",
    });
  });

  it("reads the presets", () => {
    expect(parseRange({ range: "30d" }, today)).toMatchObject({ from: "2026-09-10", days: 30, prevTo: "2026-09-09" });
    expect(parseRange({ range: "90d" }, today)).toMatchObject({ from: "2026-07-12", days: 90 });
    expect(parseRange({ range: ["30d", "90d"] }, today).preset).toBe("30d");
    expect(parseRange({ range: "1000d" }, today).preset).toBe("7d");
  });

  it("takes a custom range, compared with the same number of days before", () => {
    expect(parseRange({ from: "2026-09-01", to: "2026-09-14" }, today)).toEqual({
      preset: "custom",
      from: "2026-09-01",
      to: "2026-09-14",
      days: 14,
      prevFrom: "2026-08-18",
      prevTo: "2026-08-31",
    });
  });

  it("refuses custom ranges that are reversed, in the future, too long or malformed", () => {
    for (const bad of [
      { from: "2026-09-14", to: "2026-09-01" },
      { from: "2026-10-01", to: "2026-10-10" },
      { from: "2025-01-01", to: "2026-10-09" },
      { from: "2026-02-30", to: "2026-03-02" },
      { from: "2026-09-01" },
    ]) {
      expect(parseRange(bad, today).preset).toBe("7d");
    }
  });

  it("writes ranges back into the address", () => {
    expect(rangeQuery({ preset: "7d" })).toBe("");
    expect(rangeQuery({ preset: "90d" })).toBe("?range=90d");
    expect(rangeQuery({ preset: "custom", from: "2026-09-01", to: "2026-09-14" })).toBe("?from=2026-09-01&to=2026-09-14");
    expect(rangeLabel(parseRange({ range: "90d" }, today))).toBe("Last 3 months");
    expect(rangeLabel(parseRange({ from: "2026-09-01", to: "2026-09-14" }, today))).toBe("Sep 1 – Sep 14, 2026");
  });
});

describe("dashboard numbers", () => {
  it("formats counts and changes like Figma D1", () => {
    expect(formatCount(1284)).toBe("1,284");
    expect(formatCount(12_900)).toBe("12.9K");
    expect(formatChange(250)).toBe("+250");
    expect(formatChange(-12)).toBe("−12");
    expect(formatChange(0)).toBe("0");
  });

  it("works out the conversion rate and its change in points", () => {
    expect(conversionRate(24, 347)).toBe(6.9);
    expect(conversionRate(3, 0)).toBeNull();
    expect(conversionRate(5, 2)).toBe(100);
    expect(formatPercent(6.9)).toBe("6.9%");
    expect(formatPercent(50)).toBe("50%");
    expect(formatPercent(null)).toBe("—");
    expect(rateChange(6.9, 4.4)).toEqual({ value: 2.5, label: "+2.5%" });
    expect(rateChange(4.4, 6.9)).toEqual({ value: -2.5, label: "−2.5%" });
    expect(rateChange(5, null)).toBeNull();
  });

  it("shortens a patient's name to first name and last initial", () => {
    expect(shortPersonName("Sara Andrews")).toBe("Sara A.");
    expect(shortPersonName("  youssef  ben ali ")).toBe("youssef A.");
    expect(shortPersonName("Nadia")).toBe("Nadia");
  });
});

describe("what the browser may report", () => {
  it("builds search terms only from known values", () => {
    expect(termLabel({ sp: ["anxiety"], ap: ["cbt"], f: "online", st: "FL" })).toBe("Anxiety · CBT · Online · Florida");
    expect(termLabel({ sp: ["<img src=x>", "my therapist's name"], st: "ZZ" })).toBeNull();
    expect(termLabel(undefined)).toBeNull();
  });

  it("accepts counts, not free text", () => {
    expect(batchSchema.safeParse({ events: [{ t: "view", page: "home" }] }).success).toBe(true);
    expect(batchSchema.safeParse({ events: [{ t: "view", page: "/account?email=x" }] }).success).toBe(false);
    expect(batchSchema.safeParse({ events: [{ t: "quick_look", p: "Robert'); DROP" }] }).success).toBe(false);
    expect(batchSchema.safeParse({ events: [] }).success).toBe(false);
    expect(batchSchema.safeParse({ events: Array(51).fill({ t: "view", page: "home" }) }).success).toBe(false);
  });
});
