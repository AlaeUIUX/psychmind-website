"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PreviewRegion } from "@/lib/provider/steps";
import type { ProfileView } from "@/lib/provider/types";

// Shared by everything in the onboarding shell: the live preview data (saved
// profile + unsaved form values), which part of the preview to highlight, and
// when progress was last saved.

type OnboardingState = {
  preview: ProfileView;
  patchPreview: (patch: Partial<ProfileView>) => void;
  focusRegion: PreviewRegion | null;
  setFocusRegion: (region: PreviewRegion | null) => void;
  savedAt: number | null;
  markSaved: () => void;
};

const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ initial, children }: { initial: ProfileView; children: ReactNode }) {
  const [preview, setPreview] = useState<ProfileView>(initial);
  const [focusRegion, setFocusRegion] = useState<PreviewRegion | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // When the server sends a fresh snapshot (after a save), start from it
  // (adjusting state during render, React's pattern for derived resets).
  const initialKey = JSON.stringify(initial);
  const [seenKey, setSeenKey] = useState(initialKey);
  if (seenKey !== initialKey) {
    setSeenKey(initialKey);
    setPreview(initial);
  }

  const patchPreview = useCallback((patch: Partial<ProfileView>) => setPreview((p) => ({ ...p, ...patch })), []);
  const markSaved = useCallback(() => setSavedAt(Date.now()), []);

  const value = useMemo(
    () => ({ preview, patchPreview, focusRegion, setFocusRegion, savedAt, markSaved }),
    [preview, patchPreview, focusRegion, savedAt, markSaved],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}

/** Same as useOnboarding, but safe outside the wizard (e.g. the profile editor). */
export function useOptionalOnboarding() {
  return useContext(Ctx);
}
