"use client";

import type { ProfileView } from "@/lib/provider/types";
import { StepPreview } from "./step-preview";

/** The finished profile, framed, on the "submitted" screen. */
export function SubmittedPreview({ profile }: { profile: ProfileView }) {
  return <StepPreview profile={profile} step="review" highlight={null} className="h-full" />;
}
