"use client";

import { useTrackProfileView, useTrackView } from "@/lib/analytics/client";

/** Counts a full profile view (analytics). Renders nothing. */
export function TrackProfile({ publicId }: { publicId: string }) {
  useTrackView("profile");
  useTrackProfileView(publicId);
  return null;
}
