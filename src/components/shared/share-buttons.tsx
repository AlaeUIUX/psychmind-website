"use client";

import { useState } from "react";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently no-op.
    }
  };

  return (
    <div className="flex items-start gap-3">
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1 rounded-lg border border-warm-300 bg-warm-100 px-3.5 py-2.5 text-sm font-semibold text-warm-700 shadow-sm hover:bg-warm-200 transition-colors"
      >
        <img src="/images/legal/copy-icon.svg" alt="" width={20} height={20} />
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href="https://twitter.com/intent/tweet"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="inline-flex items-center justify-center rounded-lg border border-warm-300 bg-warm-100 p-2.5 shadow-sm hover:bg-warm-200 transition-colors"
      >
        <img src="/images/legal/x-icon.svg" alt="" width={20} height={20} />
      </a>
      <a
        href="https://www.facebook.com/sharer/sharer.php"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="inline-flex items-center justify-center rounded-lg border border-warm-300 bg-warm-100 p-2.5 shadow-sm hover:bg-warm-200 transition-colors"
      >
        <img src="/images/legal/facebook-icon.svg" alt="" width={20} height={20} />
      </a>
      <a
        href="https://www.linkedin.com/sharing/share-offsite"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex items-center justify-center rounded-lg border border-warm-300 bg-warm-100 p-2.5 shadow-sm hover:bg-warm-200 transition-colors"
      >
        <img src="/images/legal/linkedin-icon.svg" alt="" width={20} height={20} />
      </a>
    </div>
  );
}
