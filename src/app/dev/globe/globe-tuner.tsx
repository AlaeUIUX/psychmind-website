"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GLOBE_DEFAULTS } from "@/components/home/globe-scene/scene";
import { PrivacyGlobe, type GlobeSettings } from "@/components/home/privacy-globe";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// The tuning page's controls, one per setting in GLOBE_DEFAULTS (globe-scene/
// scene.js), and two pictures framed as the privacy card frames it. What's set
// here is kept in this browser until Reset; Copy settings puts it on the
// clipboard, to carry over into GLOBE_DEFAULTS.

type NumberKey = { [K in keyof GlobeSettings]: GlobeSettings[K] extends number ? K : never }[keyof GlobeSettings];
type Control =
  | { key: NumberKey; label: string; min: number; max: number; step: number; unit?: string }
  | { key: "dressColour"; label: string; toggle: true };

const GROUPS: { title: string; controls: Control[] }[] = [
  {
    title: "Boat print",
    controls: [
      { key: "dotSize", label: "Dot size", min: 1, max: 4, step: 0.5, unit: "px" },
      { key: "toneCurve", label: "Tone curve", min: 0.3, max: 3, step: 0.05 },
      { key: "contrast", label: "Contrast", min: 0.2, max: 2.5, step: 0.05 },
      { key: "brightness", label: "Brightness", min: -0.5, max: 0.5, step: 0.01 },
      { key: "outline", label: "Outline", min: 0, max: 3, step: 1, unit: " dots" },
      { key: "dressColour", label: "Dress in colour", toggle: true },
    ],
  },
  {
    title: "Boat light",
    controls: [
      { key: "keyLight", label: "Key light", min: 0, max: 8, step: 0.05 },
      { key: "fillLight", label: "Fill light", min: 0, max: 4, step: 0.05 },
      { key: "underside", label: "Underside", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: "Boat",
    controls: [
      { key: "size", label: "Boat size", min: 10, max: 56, step: 1, unit: "px" },
      { key: "girl", label: "Girl size", min: 0.8, max: 2.4, step: 0.05, unit: "×" },
      { key: "buoyancy", label: "Buoyancy", min: 1, max: 30, step: 0.5 },
      { key: "damping", label: "Damping", min: 0.2, max: 10, step: 0.1 },
      { key: "rocking", label: "Rocking", min: 0, max: 1.5, step: 0.05 },
    ],
  },
  {
    title: "Planet",
    controls: [
      { key: "planetSize", label: "Size (against the width)", min: 0.3, max: 1.2, step: 0.01, unit: "×" },
      { key: "crown", label: "Boat height (from the top)", min: 0.2, max: 0.85, step: 0.01 },
      { key: "tilt", label: "Lean toward you", min: 0, max: 0.8, step: 0.01 },
      { key: "spin", label: "Spin speed", min: 0, max: 0.5, step: 0.005 },
    ],
  },
  {
    title: "Islands",
    controls: [
      { key: "landLevel", label: "Land level (lower, more land)", min: 0.3, max: 0.75, step: 0.005 },
      { key: "islandScale", label: "Scale (higher, smaller islands)", min: 1, max: 10, step: 0.1 },
      { key: "coastWarp", label: "Coast wander", min: 0, max: 1, step: 0.01 },
      { key: "openSea", label: "Open sea round her", min: 0, max: 0.8, step: 0.01 },
      { key: "landSeed", label: "Seed", min: 0, max: 30, step: 1 },
    ],
  },
  {
    title: "Surf",
    controls: [
      { key: "surfSpacing", label: "Line spacing", min: 3, max: 20, step: 0.5, unit: "px" },
      { key: "surfReach", label: "Reach", min: 8, max: 80, step: 1, unit: "px" },
      { key: "surfSpeed", label: "Speed", min: 0, max: 2, step: 0.05 },
      { key: "rim", label: "Rim width", min: 0.5, max: 6, step: 0.1, unit: "px" },
    ],
  },
  {
    title: "Waves",
    controls: [
      { key: "waveHeight", label: "Height on the outline", min: 0, max: 1, step: 0.01 },
      { key: "waveShade", label: "Shading", min: 0, max: 1.5, step: 0.01 },
      { key: "waveLength", label: "Length", min: 0.4, max: 2.5, step: 0.05, unit: "×" },
      { key: "steepness", label: "Steepness", min: 0, max: 2, step: 0.05, unit: "×" },
      { key: "waveSpeed", label: "Speed", min: 0, max: 3, step: 0.05, unit: "×" },
      { key: "chop", label: "Chop", min: 0, max: 1, step: 0.01 },
      { key: "foam", label: "Crest foam", min: 0, max: 1, step: 0.01 },
    ],
  },
];

const STORE = "psychmind:globe-tune";

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

function Preview({ label, width, tune }: { label: string; width: number; tune: GlobeSettings }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="type-caption text-text-tertiary">{label}</figcaption>
      <div className="w-fit rounded-card border border-warm-200 bg-warm-100 p-1.5">
        <div className="rounded-[13px] border border-warm-200 bg-white p-1.5">
          <div className="relative h-[300px] overflow-hidden rounded-[6px] bg-warm-100" style={{ width }}>
            <PrivacyGlobe tune={tune} />
          </div>
        </div>
      </div>
    </figure>
  );
}

export function GlobeTuner() {
  const [tune, setTune] = useState<GlobeSettings>(GLOBE_DEFAULTS);

  // what was set here last time (read after the first paint: the server has no storage)
  useEffect(() => {
    try {
      const kept = JSON.parse(localStorage.getItem(STORE) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off read of this browser's storage
      if (kept) setTune({ ...GLOBE_DEFAULTS, ...kept });
    } catch {}
  }, []);

  const change = (next: GlobeSettings) => {
    setTune(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {}
  };
  const reset = () => {
    setTune(GLOBE_DEFAULTS);
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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h1 className="type-h3 text-text-primary">Globe</h1>
            <p className="type-small text-text-tertiary">
              The privacy card&rsquo;s picture, changing as you move the controls. Copy the settings when it feels right.
            </p>
          </header>
          <div className="flex flex-wrap gap-6">
            <Preview label="Desktop, as on the card (482 × 300)" width={482} tune={tune} />
            <Preview label="Phone (315 × 300)" width={315} tune={tune} />
          </div>
          <pre className="overflow-x-auto rounded-card border border-warm-200 bg-white p-4 type-caption text-text-secondary">
            {JSON.stringify(tune, null, 2)}
          </pre>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-6 rounded-card border border-warm-200 bg-white p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-80 lg:overflow-y-auto">
          {GROUPS.map((group) => (
            <section key={group.title} className="flex flex-col gap-4">
              <h2 className="type-overline text-text-tertiary">{group.title}</h2>
              {group.controls.map((c) =>
                "toggle" in c ? (
                  <div key={c.key} className="flex items-center justify-between gap-3">
                    <Label htmlFor={`tune-${c.key}`}>{c.label}</Label>
                    <Switch id={`tune-${c.key}`} checked={tune[c.key]} onCheckedChange={(on) => change({ ...tune, [c.key]: on })} />
                  </div>
                ) : (
                  <div key={c.key} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="type-small text-text-primary">{c.label}</span>
                      <span className={`type-caption tabular-nums ${tune[c.key] === GLOBE_DEFAULTS[c.key] ? "text-text-tertiary" : "text-text-primary"}`}>
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
                ),
              )}
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
