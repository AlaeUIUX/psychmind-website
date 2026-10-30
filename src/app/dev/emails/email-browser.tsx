"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type PreviewEmail = { id: string; name: string; subject: string; to: string; html: string };

const WIDTHS = { desktop: 680, phone: 375 } as const;

// A list of every email on the left, the chosen one on the right in a frame
// as wide as a desktop inbox or a phone. The frame grows to the email's height.
export function EmailBrowser({ groups }: { groups: { group: string; emails: PreviewEmail[] }[] }) {
  const all = groups.flatMap((g) => g.emails);
  const [id, setId] = useState(all[0]?.id);
  const [width, setWidth] = useState<keyof typeof WIDTHS>("desktop");
  const [height, setHeight] = useState(1200);
  const current = all.find((e) => e.id === id) ?? all[0];
  const frame = useRef<HTMLIFrameElement>(null);

  // Size the frame to the email. Its load can finish before hydration, so
  // measure now if it's already loaded, and again on load (images included).
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      const doc = el.contentDocument;
      if (doc?.documentElement) setHeight(doc.documentElement.scrollHeight);
    };
    if (el.contentDocument?.readyState === "complete") measure();
    el.addEventListener("load", measure);
    return () => el.removeEventListener("load", measure);
  }, [current?.id, width]);

  return (
    <div className="app-ui min-h-svh bg-warm-50 text-warm-900">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 lg:flex-row lg:items-start">
        <nav aria-label="Emails" className="flex flex-col gap-5 lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
          <header className="flex flex-col gap-1">
            <h1 className="type-ui-headline text-text-primary">Emails</h1>
            <p className="type-ui-small text-warm-900/60">
              Every email the app sends ({all.length}), with sample data. Sent ones land in /dev/mail.
            </p>
          </header>
          {groups.map(({ group, emails }) => (
            <div key={group} className="flex flex-col gap-1">
              <p className="px-2.5 type-ui-caption text-warm-900/60">{group}</p>
              <ul className="flex flex-col">
                {emails.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setId(e.id);
                        setHeight(1200);
                      }}
                      aria-current={e.id === current?.id ? "true" : undefined}
                      className={cn(
                        "w-full rounded-[10px] px-2.5 py-1.5 text-left type-ui-small text-warm-900/70 transition-colors hover:bg-warm-900/[0.04] hover:text-warm-900",
                        e.id === current?.id && "bg-warm-900/[0.06] text-warm-900",
                      )}
                    >
                      {e.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {current && (
          <section aria-label="Preview" className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <p className="truncate type-ui-heading text-text-primary">{current.subject}</p>
                <p className="truncate type-ui-small text-warm-900/60">To: {current.to}</p>
              </div>
              <ToggleGroup
                type="single"
                variant="segment"
                aria-label="Width"
                value={width}
                onValueChange={(v) => {
                  if (!v) return;
                  setWidth(v as keyof typeof WIDTHS);
                  setHeight(1200);
                }}
              >
                <ToggleGroupItem value="desktop" className="h-8 px-3 type-ui-label">
                  Desktop
                </ToggleGroupItem>
                <ToggleGroupItem value="phone" className="h-8 px-3 type-ui-label">
                  Phone
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="overflow-x-auto rounded-[20px] border border-warm-900/10 bg-warm-900/[0.04] p-1.5">
              <iframe
                ref={frame}
                key={`${current.id}-${width}`}
                title={current.subject}
                srcDoc={current.html}
                // same-origin only so the frame can be sized to the email; emails carry no scripts
                sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                style={{ width: WIDTHS[width], height }}
                className="mx-auto block max-w-none rounded-[13px] border border-warm-900/10 bg-white"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
