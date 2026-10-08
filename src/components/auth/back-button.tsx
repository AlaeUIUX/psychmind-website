"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1.5 rounded-pill border border-warm-200 px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-warm-100"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/how-it-works/back-arrow-icon.svg" alt="" width={12} height={12} />
      Go back
    </button>
  );
}
