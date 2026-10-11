// The age screen at sign-up. PsychMind accounts are for adults (Terms §3), so
// everyone gives their date of birth before an account exists. It's a neutral
// screen (FTC COPPA guidance): no age is pre-filled, nothing says which answer
// gets in, and a "no" sticks (see AGE_BLOCK_COOKIE) so going back and picking
// another year doesn't work. The date itself is never stored; the account
// only records when the check passed (user.age_confirmed_at).

export const MIN_AGE = 18;

/** Set after an under-age answer, so the form stays closed on this browser. */
export const AGE_BLOCK_COOKIE = "psychmind_age_block";
export const AGE_BLOCK_SECONDS = 60 * 60 * 24;
/** Set after a passing answer just before "Continue with Google" (server/auth/age.ts). */
export const AGE_OK_COOKIE = "psychmind_age_ok";
export const AGE_OK_SECONDS = 60 * 15;

export type BirthDate = { year: number; month: number; day: number };

/** A real calendar date from the three fields, or null. */
export function parseBirthDate(year: unknown, month: unknown, day: unknown, now = new Date()): BirthDate | null {
  const toInt = (v: unknown) => (typeof v === "string" && /^\d{1,4}$/.test(v.trim()) ? Number(v.trim()) : NaN);
  const y = toInt(year);
  const m = toInt(month);
  const d = toInt(day);
  if (![y, m, d].every(Number.isInteger)) return null;
  if (y < 1900 || y > now.getUTCFullYear() || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects 31 April, 29 February in a non-leap year, …
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  if (date.getTime() > now.getTime()) return null;
  return { year: y, month: m, day: d };
}

/** Whole years old on `now` (US Eastern date, where the business runs). */
export function ageOn(birth: BirthDate, now = new Date()): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  const hadBirthday = m > birth.month || (m === birth.month && d >= birth.day);
  return y - birth.year - (hadBirthday ? 0 : 1);
}

export const isAdult = (birth: BirthDate, now = new Date()) => ageOn(birth, now) >= MIN_AGE;

/** "YYYY-MM-DD", the form Better Auth's sign-up body carries it in. */
export const isoDate = (b: BirthDate) => `${b.year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;

export function parseIsoDate(value: unknown, now = new Date()): BirthDate | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? parseBirthDate(match[1], match[2], match[3], now) : null;
}
