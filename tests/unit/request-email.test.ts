import { describe, expect, it } from "vitest";
import { planRequestEmail } from "@/lib/requests";

// What saving "Send session requests to" does (lib/requests.ts): a new
// address waits for its inbox to confirm it.

const account = "maya@example.com";

describe("the requests address", () => {
  it("goes back to the account email at once when emptied or set to it", () => {
    expect(planRequestEmail("", account, "desk@practice.com")).toEqual({ kind: "account" });
    expect(planRequestEmail("  ", account, null)).toEqual({ kind: "account" });
    expect(planRequestEmail(" Maya@Example.com ", account, "desk@practice.com")).toEqual({ kind: "account" });
  });

  it("keeps the confirmed address without a new link", () => {
    expect(planRequestEmail("DESK@practice.com", account, "desk@practice.com")).toEqual({ kind: "unchanged" });
  });

  it("asks a new address to confirm, lower-cased", () => {
    expect(planRequestEmail(" Front-Desk@Practice.com", account, null)).toEqual({ kind: "confirm", email: "front-desk@practice.com" });
    expect(planRequestEmail("new@practice.com", account, "desk@practice.com")).toEqual({ kind: "confirm", email: "new@practice.com" });
  });
});
