// How the dashboards write numbers (Figma D1: "1,284", "+250", "6.9%", "+2.5%").

/** "1,284", then "12.9K" from ten thousand up. */
export function formatCount(n: number): string {
  if (Math.abs(n) >= 10_000) return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return n.toLocaleString("en-US");
}

/** A signed change: "+250", "−12", "0". */
export function formatChange(n: number): string {
  if (n === 0) return "0";
  return `${n > 0 ? "+" : "−"}${formatCount(Math.abs(n))}`;
}

/** Session requests per profile view, as a percentage (null without views). */
export function conversionRate(requests: number, views: number): number | null {
  if (views <= 0) return null;
  return Math.min(100, Math.round((requests / views) * 1000) / 10);
}

/** "6.9%", "10%", or "—" when there's nothing to divide by. */
export function formatPercent(p: number | null): string {
  if (p == null) return "—";
  return `${p.toFixed(1).replace(/\.0$/, "")}%`;
}

/** The change between two rates, in points: "+2.5%" (Figma's format). */
export function rateChange(current: number | null, previous: number | null): { value: number; label: string } | null {
  if (current == null || previous == null) return null;
  const value = Math.round((current - previous) * 10) / 10;
  if (value === 0) return { value, label: "0%" };
  return { value, label: `${value > 0 ? "+" : "−"}${formatPercent(Math.abs(value))}` };
}

/** "Sara A." from "Sara Andrews": first name and last initial (Figma D1). */
export function shortPersonName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts.at(-1)!.charAt(0).toUpperCase()}.`;
}
