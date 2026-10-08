"use client";

import { CrisisStrip } from "@/components/app/crisis-strip";
import { ErrorState } from "@/components/app/error-state";

// Error boundary for the directory: the header and footer stay, the page body
// is replaced by a calm retry panel.
export default function DirectoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-16">
      <ErrorState onRetry={reset} />
      <CrisisStrip />
    </div>
  );
}
