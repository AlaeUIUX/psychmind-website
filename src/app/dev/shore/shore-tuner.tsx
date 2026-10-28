"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShoreScene, type ShoreSettings } from "@/components/blog/shore-scene";
import { SHORE_DEFAULTS } from "@/components/home/globe-scene/shore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// The tuning page's controls, one per setting in SHORE_DEFAULTS (globe-scene/shore.js),
// and two pictures framed as the blog frames the shore. What's set here is kept in this
// browser until Reset; Copy settings puts it on the clipboard, to carry over into
// SHORE_DEFAULTS. (As /dev/globe does for the privacy globe.)

type Control = { key: keyof ShoreSettings; label: string; min: number; max: number; step: number; unit?: string };

const GROUPS: { title: string; controls: Control[] }[] = [
  {
    title: "Dune",
    controls: [
      { key: "ridgeDistance", label: "Crest distance", min: 30, max: 160, step: 1, unit: " m" },
      { key: "crestLighthouse", label: "Height by the lighthouse", min: 0.5, max: 12, step: 0.05, unit: " m" },
      { key: "crestMiddle", label: "Height mid-way", min: 0.5, max: 12, step: 0.05, unit: " m" },
      { key: "crestThreeQuarters", label: "Height three quarters across", min: 0.2, max: 10, step: 0.05, unit: " m" },
      { key: "crestRight", label: "Height at the right edge", min: 0.1, max: 8, step: 0.05, unit: " m" },
      { key: "faceCurve", label: "Face (higher: flatter near you)", min: 0.6, max: 5, step: 0.05 },
      { key: "ridgeWander", label: "Crest wander", min: 0, max: 4, step: 0.05, unit: "×" },
      { key: "hummocks", label: "Hummocks", min: 0, max: 4, step: 0.05, unit: "×" },
    ],
  },
  {
    title: "Shore",
    controls: [
      { key: "shoreNear", label: "Shoreline across, 38 m out", min: -10, max: 60, step: 0.1, unit: " m" },
      { key: "shoreFar", label: "Shoreline across, 125 m out", min: -10, max: 120, step: 0.5, unit: " m" },
      { key: "beachWidth", label: "Beach width", min: 3, max: 40, step: 0.5, unit: " m" },
      { key: "beachSlope", label: "Beach slope", min: 0.005, max: 0.15, step: 0.005 },
      { key: "wetWidth", label: "Wet sand", min: 0, max: 15, step: 0.1, unit: " m" },
    ],
  },
  {
    title: "Water",
    controls: [
      { key: "waterOpacity", label: "Opacity", min: 0.2, max: 1, step: 0.01 },
      { key: "waterColour", label: "Colour kept", min: 0, max: 1, step: 0.01 },
      { key: "swellSpacing", label: "Swell spacing", min: 4, max: 40, step: 0.5, unit: " m" },
      { key: "swellSpeed", label: "Swell speed", min: 0, max: 5, step: 0.05 },
      { key: "swellStrength", label: "Swell crests", min: 0, max: 1, step: 0.01 },
      { key: "glints", label: "Glints", min: 0, max: 0.6, step: 0.01 },
    ],
  },
  {
    title: "Foam",
    controls: [
      { key: "foamWidth", label: "Width", min: 0.2, max: 6, step: 0.05, unit: " m" },
      { key: "foamWash", label: "Wash in and out", min: 0, max: 4, step: 0.05, unit: " m" },
      { key: "foamSpeed", label: "Speed", min: 0, max: 3, step: 0.05 },
      { key: "foamLine", label: "Line coming in", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: "Sand",
    controls: [
      { key: "contourSpacing", label: "Contour spacing", min: 0.08, max: 1.5, step: 0.01, unit: " m" },
      { key: "contourStrength", label: "Contour strength", min: 0, max: 1, step: 0.01 },
      { key: "streaks", label: "Streaks", min: 0, max: 1, step: 0.01 },
      { key: "dashes", label: "Dashes", min: 0, max: 3, step: 0.05, unit: "×" },
      { key: "fogNear", label: "Fade from", min: 20, max: 600, step: 5, unit: " m" },
      { key: "fogFar", label: "Fade to", min: 100, max: 2000, step: 10, unit: " m" },
    ],
  },
  {
    title: "Lighthouse",
    controls: [
      { key: "lighthouseX", label: "Across", min: -200, max: 60, step: 0.5, unit: " m" },
      { key: "lighthouseDistance", label: "Distance", min: 60, max: 600, step: 1, unit: " m" },
      { key: "headland", label: "Headland height", min: 0, max: 30, step: 0.1, unit: " m" },
    ],
  },
  {
    title: "Girl",
    controls: [
      { key: "girlX", label: "Desktop: from the left", min: 0, max: 1, step: 0.002 },
      { key: "girlY", label: "Desktop: from the top", min: 0, max: 1, step: 0.002 },
      { key: "girlPhoneX", label: "Phone: from the left", min: 0, max: 1, step: 0.002 },
      { key: "girlPhoneY", label: "Phone: from the top", min: 0, max: 1, step: 0.002 },
      { key: "girlSize", label: "Size, against the lighthouse", min: 0.03, max: 0.4, step: 0.005, unit: "×" },
    ],
  },
  {
    title: "Camera",
    controls: [{ key: "eye", label: "Eye height", min: 0.5, max: 12, step: 0.05, unit: " m" }],
  },
];

const STORE = "psychmind:shore-tune";

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

export function ShoreTuner() {
  const [tune, setTune] = useState<ShoreSettings>(SHORE_DEFAULTS);
  // what the previews draw: the latest settings, a moment after the last change (the
  // ground is rebuilt when its shape changes, so not on every step of a drag)
  const [applied, setApplied] = useState<ShoreSettings>(SHORE_DEFAULTS);

  // what was set here last time (read after the first paint: the server has no storage)
  useEffect(() => {
    try {
      const kept = JSON.parse(localStorage.getItem(STORE) ?? "null");
      // (settings that no longer exist, such as girlHeight, are left behind)
      const known = kept ? Object.fromEntries(Object.entries(kept).filter(([k]) => k in SHORE_DEFAULTS)) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off read of this browser's storage
      if (known) setTune({ ...SHORE_DEFAULTS, ...known });
    } catch {}
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => setApplied(tune), 120);
    return () => window.clearTimeout(id);
  }, [tune]);

  const change = (next: ShoreSettings) => {
    setTune(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {}
  };
  const reset = () => {
    setTune(SHORE_DEFAULTS);
    try {
      localStorage.removeItem(STORE);
    } catch {}
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tune, null, 2));
      toast.success("Settings copied");
    } catch {
      toast.error("Couldn't copy. Select the settings below instead.");
    }
  };

  return (
    <main className="min-h-screen bg-warm-25 px-6 py-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h1 className="type-h3 text-text-primary">Shore</h1>
            <p className="type-small text-text-tertiary">
              The blog&rsquo;s shore, changing as you move the controls. Copy the settings when it feels right.
            </p>
          </header>
          <figure className="flex flex-col gap-2">
            <figcaption className="type-caption text-text-tertiary">Desktop, as on the blog (the band at 4 : 1)</figcaption>
            <div className="overflow-hidden rounded-card border border-warm-200 bg-warm-25">
              <ShoreScene tune={applied} className="relative aspect-[4/1] w-full" />
            </div>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="type-caption text-text-tertiary">Phone (390 wide)</figcaption>
            <div className="w-fit overflow-hidden rounded-card border border-warm-200 bg-warm-25">
              <ShoreScene tune={applied} className="relative aspect-[1512/840] w-[390px]" />
            </div>
          </figure>
          <pre className="overflow-x-auto rounded-card border border-warm-200 bg-white p-4 type-caption text-text-secondary">
            {JSON.stringify(tune, null, 2)}
          </pre>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-6 rounded-card border border-warm-200 bg-white p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-80 lg:overflow-y-auto">
          {GROUPS.map((group) => (
            <section key={group.title} className="flex flex-col gap-4">
              <h2 className="type-overline text-text-tertiary">{group.title}</h2>
              {group.controls.map((c) => (
                <div key={c.key} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="type-small text-text-primary">{c.label}</span>
                    <span
                      className={`type-caption tabular-nums ${tune[c.key] === SHORE_DEFAULTS[c.key] ? "text-text-tertiary" : "text-text-primary"}`}
                    >
                      {tune[c.key].toFixed(decimals(c.step))}
                      {c.unit}
                    </span>
                  </div>
                  <Slider
                    aria-label={c.label}
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={[tune[c.key]]}
                    onValueChange={([v]) => change({ ...tune, [c.key]: v })}
                  />
                </div>
              ))}
            </section>
          ))}
          <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-2 border-t border-warm-200 bg-white p-5">
            <Button variant="primary" size="sm" className="flex-1" onClick={copy}>
              Copy settings
            </Button>
            <Button variant="secondary" size="sm" onClick={reset}>
              Reset
            </Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
