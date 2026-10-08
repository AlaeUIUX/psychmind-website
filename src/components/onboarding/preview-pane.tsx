"use client";

import { cn } from "cn";
import { LockIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProviderProfileView } from "@/components/provider/profile-view";
import type { PreviewRegion } from "@/lib/provider/steps";
import type { ProfileView } from "@/lib/provider/types";

const slug = (p: ProfileView) =>
  [p.displayAsBusiness && p.businessName ? p.businessName : `${p.firstName ?? ""} ${p.lastName ?? ""}`]
    .join("")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "your-name";

// The live preview, framed as the real page it will become: a browser window
// with the public URL, desktop or phone width, scaled to fit the pane. The
// region being edited is ringed and scrolled into view.
export function PreviewPane({ profile, highlight, className }: { profile: ProfileView; highlight: PreviewRegion | null; className?: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const frame = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const chosen = useRef(false);
  const width = device === "desktop" ? 1040 : 390;

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      // Too narrow for a legible desktop page: show the phone layout.
      if (device === "desktop" && !chosen.current && entry.contentRect.width < 480) setDevice("mobile");
      setScale(Math.min(1, entry.contentRect.width / width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, device]);

  useEffect(() => {
    if (!highlight || !scroller.current) return;
    const target = scroller.current.querySelector<HTMLElement>(`[data-region="${highlight}"]`);
    if (!target) return;
    const box = scroller.current.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const top = scroller.current.scrollTop + (t.top - box.top) - box.height / 3;
    scroller.current.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [highlight, device, scale]);

  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border border-warm-200 bg-white shadow-[0_1px_2px_rgb(28_25_23/0.04),0_24px_48px_-28px_rgb(28_25_23/0.25)]", className)}>
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-warm-200 bg-warm-50 px-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-warm-300" />
          <span className="size-2.5 rounded-full bg-warm-300" />
          <span className="size-2.5 rounded-full bg-warm-300" />
        </span>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-2.5 py-1 font-mono text-[11.5px] text-warm-500 ring-1 ring-warm-200">
          <LockIcon aria-hidden className="size-3 shrink-0" />
          <span className="truncate">psychmind.org/providers/{slug(profile)}</span>
        </span>
        <div role="radiogroup" aria-label="Preview size" className="flex rounded-md bg-warm-100 p-0.5">
          {(
            [
              ["desktop", MonitorIcon, "Desktop preview"],
              ["mobile", SmartphoneIcon, "Phone preview"],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={device === value}
              aria-label={label}
              onClick={() => {
                chosen.current = true;
                setDevice(value);
              }}
              className={cn(
                "flex size-6 items-center justify-center rounded transition-colors",
                device === value ? "bg-white text-warm-900 shadow-sm" : "text-warm-500 hover:text-warm-800",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} className="relative flex-1 overflow-y-auto overscroll-contain bg-warm-25">
        <div ref={frame} className={cn("mx-auto w-full", device === "mobile" && "max-w-[300px] py-4")}>
          <div
            style={{ width, transform: `scale(${scale})`, transformOrigin: "top left", height: 0 }}
            className="relative"
            aria-label="Live preview of your public profile"
          >
            <div className={cn("p-6", device === "mobile" && "p-0")}>
              <ProviderProfileView profile={profile} mode="preview" highlight={highlight} className={device === "mobile" ? "rounded-[28px]" : undefined} />
            </div>
          </div>
          {/* Reserve the scaled height so the scroller can scroll. */}
          <ScaledSpacer scale={scale} deps={[profile, device]} />
        </div>
      </div>
    </div>
  );
}

/** The transformed preview has no layout height; measure it and make room. */
function ScaledSpacer({ scale, deps }: { scale: number; deps: unknown[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const content = ref.current?.previousElementSibling?.firstElementChild as HTMLElement | null;
    if (!content) return;
    const ro = new ResizeObserver(() => setH(content.offsetHeight * scale));
    ro.observe(content);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, ...deps]);
  return <div ref={ref} style={{ height: h }} aria-hidden />;
}
