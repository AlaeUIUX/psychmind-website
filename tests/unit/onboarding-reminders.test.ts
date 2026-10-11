import { describe, expect, it } from "vitest";
import { reminderDue } from "@/lib/onboarding-reminders";

const now = new Date("2026-10-11T13:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("reminderDue", () => {
  it("waits a full day after the last change", () => {
    expect(reminderDue(daysAgo(0.5), now, [])).toBeNull();
    expect(reminderDue(daysAgo(1), now, [])).toBe(1);
  });

  it("sends the 1-, 3- and 7-day reminders in turn", () => {
    expect(reminderDue(daysAgo(2), now, [])).toBe(1);
    expect(reminderDue(daysAgo(3), now, [1])).toBe(3);
    expect(reminderDue(daysAgo(7.2), now, [1, 3])).toBe(7);
  });

  it("never repeats a reminder", () => {
    expect(reminderDue(daysAgo(2), now, [1])).toBeNull();
    expect(reminderDue(daysAgo(8), now, [1, 3, 7])).toBeNull();
    // They came back after the 1-day reminder, then left again: no second one.
    expect(reminderDue(daysAgo(1.5), now, [1])).toBeNull();
  });

  it("after a missed run, sends only the reminder whose window it is", () => {
    expect(reminderDue(daysAgo(4), now, [])).toBe(3);
  });

  it("leaves drafts abandoned two weeks ago alone", () => {
    expect(reminderDue(daysAgo(14), now, [])).toBeNull();
    expect(reminderDue(daysAgo(90), now, [])).toBeNull();
  });
});
