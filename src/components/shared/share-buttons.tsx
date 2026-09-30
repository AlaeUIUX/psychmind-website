"use client";

import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";

const networks = [
  {
    label: "Share on X",
    icon: "/images/legal/x-icon.svg",
    base: "https://twitter.com/intent/tweet",
    param: "url",
  },
  {
    label: "Share on Facebook",
    icon: "/images/legal/facebook-icon.svg",
    base: "https://www.facebook.com/sharer/sharer.php",
    param: "u",
  },
  {
    label: "Share on LinkedIn",
    icon: "/images/legal/linkedin-icon.svg",
    base: "https://www.linkedin.com/sharing/share-offsite/",
    param: "url",
  },
];

// Opens the network's share dialog with the current page attached. The
// plain href stays as a fallback for middle-click / no-JS.
function share(e: MouseEvent<HTMLAnchorElement>, network: (typeof networks)[number]) {
  e.preventDefault();
  const url = `${network.base}?${network.param}=${encodeURIComponent(window.location.href)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

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
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" className="h-10 sm:h-9" onClick={handleCopyLink} aria-live="polite">
        <img src="/images/legal/copy-icon.svg" alt="" className="size-4" />
        {copied ? "Copied!" : "Copy link"}
      </Button>
      {networks.map((network) => (
        <Button key={network.label} asChild variant="secondary" size="icon-sm" className="size-10 sm:size-9">
          <a
            href={network.base}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={network.label}
            onClick={(e) => share(e, network)}
          >
            <img src={network.icon} alt="" className="size-4" />
          </a>
        </Button>
      ))}
    </div>
  );
}
