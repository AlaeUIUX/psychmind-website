"use client";

import type { ProfileView } from "@/lib/provider/types";
import { PreviewPane } from "./preview-pane";

/** The finished profile, framed, on the "submitted" screen. */
export function SubmittedPreview({ profile }: { profile: ProfileView }) {
  return <PreviewPane profile={profile} highlight={null} className="h-full" />;
}
