import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INSURANCE } from "@/lib/taxonomy";
import { sampleInsurance } from "@/server/directory/sample-rows";

// Migration 0021 sets the sample providers' plans in existing databases;
// sampleInsurance() sets them on samples added later. They must agree.
describe("sample insurance", () => {
  const sql = readFileSync(path.join(process.cwd(), "drizzle/0021_sample_insurance.sql"), "utf8");
  const rows = [...sql.matchAll(/ARRAY\[([^\]]*)\][^']*'sample-(\d+)@/g)].map((m) => ({ index: Number(m[2]) - 1, plans: m[1].split(",").map((v) => v.replace(/'/g, "")) }));

  it("covers the 50 samples, with the same plans as new ones get", () => {
    expect(rows).toHaveLength(50);
    for (const r of rows) expect(r.plans).toEqual(sampleInsurance(r.index));
  });

  it("only uses plans from the list", () => {
    const known = new Set<string>(INSURANCE.map((i) => i.value));
    for (const r of rows) for (const p of r.plans) expect(known.has(p)).toBe(true);
  });
});
