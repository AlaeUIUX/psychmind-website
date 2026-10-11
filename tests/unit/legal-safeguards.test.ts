import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ageOn, isAdult, isoDate, parseBirthDate, parseIsoDate } from "@/lib/age";
import { renewalTerms } from "@/lib/billing";
import { contentSecurityPolicy } from "@/lib/csp";
import { providerPhoto, selfHosted } from "@/lib/photos";
import { ageOkToken, isValidAgeOkToken, readCookie } from "@/server/auth/age";
import { layout, verifyEmail } from "@/server/emails";

// Guards for the legal safeguards (docs/legal/README.md): the 18+ age
// screen, no third-party fonts, images or session replay, CAN-SPAM email
// footers, and automatic renewal terms.

afterEach(() => vi.unstubAllEnvs());

describe("age screen", () => {
  const now = new Date("2026-10-11T16:00:00Z"); // Oct 11 in New York

  it("accepts only real calendar dates in the past", () => {
    expect(parseBirthDate("1990", "4", "21", now)).toEqual({ year: 1990, month: 4, day: 21 });
    expect(parseBirthDate("2001", "2", "29", now)).toBeNull(); // not a leap year
    expect(parseBirthDate("1990", "4", "31", now)).toBeNull();
    expect(parseBirthDate("1990", "13", "1", now)).toBeNull();
    expect(parseBirthDate("1850", "1", "1", now)).toBeNull();
    expect(parseBirthDate("2026", "12", "1", now)).toBeNull(); // future
    expect(parseBirthDate("", "", "", now)).toBeNull();
    expect(parseBirthDate("19x0", "1", "1", now)).toBeNull();
  });

  it("turns 18 on the birthday itself, not a day earlier", () => {
    expect(isAdult({ year: 2008, month: 10, day: 11 }, now)).toBe(true);
    expect(isAdult({ year: 2008, month: 10, day: 12 }, now)).toBe(false);
    expect(ageOn({ year: 2008, month: 10, day: 12 }, now)).toBe(17);
    expect(isAdult({ year: 2012, month: 1, day: 1 }, now)).toBe(false); // under 13 too
  });

  it("uses the New York date, not UTC", () => {
    // 02:00 UTC on Oct 12 is still Oct 11 in New York.
    expect(isAdult({ year: 2008, month: 10, day: 12 }, new Date("2026-10-12T02:00:00Z"))).toBe(false);
  });

  it("round-trips the ISO form the sign-up endpoint checks", () => {
    expect(isoDate({ year: 1990, month: 4, day: 1 })).toBe("1990-04-01");
    expect(parseIsoDate("1990-04-01", now)).toEqual({ year: 1990, month: 4, day: 1 });
    expect(parseIsoDate("1990-4-1", now)).toBeNull();
    expect(parseIsoDate(undefined, now)).toBeNull();
  });

  it("signs the Google proof cookie and rejects tampered or expired ones", () => {
    const token = ageOkToken(1_000);
    expect(isValidAgeOkToken(token, 2_000)).toBe(true);
    expect(isValidAgeOkToken(token, 1_000 + 16 * 60_000)).toBe(false);
    const [expires, mac] = token.split(".");
    expect(isValidAgeOkToken(`${Number(expires) + 60_000}.${mac}`, 2_000)).toBe(false);
    expect(isValidAgeOkToken("garbage", 2_000)).toBe(false);
    expect(isValidAgeOkToken(undefined)).toBe(false);
    expect(readCookie(`a=1; psychmind_age_ok=${token}; b=2`, "psychmind_age_ok")).toBe(token);
  });
});

/** Every file under src/ and public/ (text only). */
function sourceFiles(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(tsx?|jsx?|mjs|css|html|ya?ml|json)$/.test(name)) out.push(full);
  }
  return out;
}

describe("no third-party requests from visitors' browsers", () => {
  const files = [...sourceFiles("src"), ...sourceFiles("public")];

  it("loads no fonts from Google (next/font downloads them at build and serves them from our domain)", () => {
    const hits = files.filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("has no session replay or third-party analytics SDK", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const banned = /hotjar|fullstory|logrocket|smartlook|mouseflow|microsoft-clarity|clarity-js|posthog|@sentry\/replay|rrweb|heap|mixpanel|amplitude|google-analytics|gtag|segment/i;
    expect(deps.filter((d) => banned.test(d))).toEqual([]);
    const replay = files.filter((f) => /replayIntegration|Sentry\.Replay|rrweb|clarity\.ms|hotjar\.com/.test(readFileSync(f, "utf8")));
    expect(replay).toEqual([]);
  });

  it("CSP allows only our own origin for scripts, styles, fonts, images and connections", () => {
    for (const csp of [contentSecurityPolicy(null), contentSecurityPolicy("abc")]) {
      const directive = (name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";
      for (const name of ["script-src", "style-src", "font-src", "img-src", "connect-src"]) {
        expect(directive(name), name).not.toMatch(/https?:\/\/|\*\./);
      }
    }
  });

  it("serves other hosts' photos through our own image endpoint", () => {
    expect(providerPhoto("sara", 200)).toMatch(/^\/_next\/image\?url=https%3A%2F%2Fimages\.unsplash\.com.+&w=256&q=75$/);
    expect(selfHosted("https://images.unsplash.com/photo-1", 480)).toContain("&w=640&");
    expect(selfHosted("/api/files/123")).toBe("/api/files/123");
  });
});

describe("email footers (CAN-SPAM)", () => {
  it("show the postal address in every email once it's set", () => {
    vi.stubEnv("LEGAL_POSTAL_ADDRESS", "123 Main St, Suite 4, Miami, FL 33101");
    const email = verifyEmail("a@example.com", "https://app.psychmind.org/verify");
    expect(email.html).toContain("PsychMind, 123 Main St, Suite 4, Miami, FL 33101");
    expect(email.text).toContain("PsychMind, 123 Main St, Suite 4, Miami, FL 33101");
  });

  it("put an unsubscribe link in marketing email", () => {
    const { html, text } = layout({ heading: "News", body: "Hello", unsubscribeUrl: "https://app.psychmind.org/unsubscribe/tok" });
    expect(html).toContain('href="https://app.psychmind.org/unsubscribe/tok"');
    expect(text).toContain("https://app.psychmind.org/unsubscribe/tok");
  });
});

describe("automatic renewal terms", () => {
  it("state the price, how often, that it renews until cancelled, and how to cancel", () => {
    const terms = renewalTerms({ amount: "$39", interval: "month" });
    expect(terms).toContain("renews automatically every month at $39 until you cancel");
    expect(terms).toContain("Cancel anytime online");
    expect(terms.length).toBeLessThan(1200); // Stripe's custom_text limit
  });
});
