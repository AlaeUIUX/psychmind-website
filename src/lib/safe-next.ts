/** A ?next= target, only if it's a path on this site (no open redirects).
 *  Browsers read "//host" and "/\host" as other sites, and drop tabs and
 *  newlines ("/\t/host"), so those are refused too. */
export function safeNext(next: unknown): string | null {
  const value = typeof next === "string" ? next : "";
  return /^\/(?![/\\])/.test(value) && !/[\u0000-\u001f\u007f]/.test(value) ? value : null;
}
