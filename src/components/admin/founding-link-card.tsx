"use client";

import { CheckIcon, CopyIcon } from "@/components/ui/hugeicons";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { newFoundingLink, setFoundingLinkActive, type FoundingActionState } from "@/server/admin/founding-actions";

// Admin → Settings: the founding link (server/founding.ts). Copy: TODO(client).

export function FoundingLinkCard({ url, active, taken, cap }: { url: string | null; active: boolean; taken: number; cap: number }) {
  const [replaceState, replace, replacing] = useActionState<FoundingActionState, FormData>(newFoundingLink, null);
  const [toggleState, toggle, toggling] = useActionState<FoundingActionState, FormData>(setFoundingLinkActive, null);
  const [copied, setCopied] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const full = taken >= cap;
  const error = replaceState?.error ?? toggleState?.error;

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="type-small font-medium text-text-primary">Founding link</h2>
        <p className="type-small text-text-tertiary">
          Providers who sign up through this link are listed free, for good, once verified. The first {cap} who join get a spot.
        </p>
      </div>

      <p className="type-small text-text-primary" data-testid="founding-taken">
        <span className="type-ui-figure">{taken}</span> of {cap} spots taken
        {full && <span className="text-text-tertiary"> · the link is full</span>}
      </p>

      {url ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code
              className={`min-w-0 flex-1 truncate rounded-lg border border-warm-900/10 bg-warm-900/[0.03] px-3 py-2 type-ui-small ${active ? "text-text-primary" : "text-text-tertiary line-through"}`}
              data-testid="founding-url"
            >
              {url}
            </code>
            <Button type="button" variant="secondary" size="sm" onClick={copy} disabled={!active}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="type-small text-text-tertiary">{active ? "The link is on." : "The link is off: it shows “This link isn't active”."}</p>
          <div className="flex flex-wrap gap-2">
            <form action={toggle}>
              {!active && <input type="hidden" name="active" value="on" />}
              <Button type="submit" variant="secondary" size="sm" disabled={toggling}>
                {active ? "Turn the link off" : "Turn the link on"}
              </Button>
            </form>
            {confirmReplace ? (
              <form action={replace} className="flex flex-wrap items-center gap-2">
                <span className="type-small text-text-tertiary">The current link will stop working.</span>
                <Button type="submit" size="sm" disabled={replacing}>
                  Make a new link
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReplace(false)}>
                  Cancel
                </Button>
              </form>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReplace(true)}>
                Make a new link
              </Button>
            )}
          </div>
        </>
      ) : (
        <form action={replace}>
          <Button type="submit" size="sm" disabled={replacing}>
            Create the founding link
          </Button>
        </form>
      )}
      {error && <p className="type-small text-red-700">{error}</p>}
    </section>
  );
}
