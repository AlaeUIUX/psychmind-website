// Development only: the 3D scenes (components/home/*-scene, globe-scene) reload the
// page when their code is edited, since hot reloading swaps a module but not the
// scene it already built. The page comes back where it was: the scroll is kept for
// the reload, and SmoothScroll restores it instead of starting at the top.

const KEY = "psychmind:dev-scroll";

export function reloadKeepingScroll() {
  try {
    sessionStorage.setItem(KEY, String(window.scrollY));
  } catch {}
  window.location.reload();
}

/** The scroll to come back to after such a reload (once), or null. */
export function takeKeptScroll(): number | null {
  try {
    const y = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return y === null ? null : Number(y);
  } catch {
    return null;
  }
}
