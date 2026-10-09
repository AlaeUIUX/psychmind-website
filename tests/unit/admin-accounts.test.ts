import { describe, expect, it } from "vitest";
import { TEMP_PASSWORD_ALPHABET, TEMP_PASSWORD_PATTERN, temporaryPassword } from "@/lib/admin/temporary-password";
import { isProtectedPath, loginPathFor } from "@/lib/hosts";

describe("temporary admin passwords", () => {
  it("are four groups of four, without look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      const p = temporaryPassword();
      expect(p).toMatch(TEMP_PASSWORD_PATTERN);
      expect(p).not.toMatch(/[01ILO]/);
    }
    expect(TEMP_PASSWORD_ALPHABET).toHaveLength(31);
  });

  it("don't repeat", () => {
    const seen = new Set(Array.from({ length: 2000 }, temporaryPassword));
    expect(seen.size).toBe(2000);
  });
});

describe("the admin log-in", () => {
  it("is the way in to the console, and is itself open", () => {
    expect(loginPathFor("/admin")).toBe("/admin/login");
    expect(loginPathFor("/admin/providers/abc")).toBe("/admin/login");
    expect(loginPathFor("/provider")).toBe("/login");
    expect(loginPathFor("/administrator")).toBe("/login");
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/admin/password")).toBe(true);
    expect(isProtectedPath("/admin/login")).toBe(false);
  });
});
