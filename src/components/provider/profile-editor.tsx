"use client";

import { cn } from "cn";
import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { SectionStatus } from "@/lib/provider/completeness";
import { toProfileView, type ProviderState } from "@/lib/provider/state";
import type { ProfileView } from "@/lib/provider/types";
import type { SectionKey } from "@/server/provider/actions";
import { ProviderProfileView } from "./profile-view";
import { SectionForm } from "./section-form";

// Edit every profile field after onboarding: section list on the left, the
// section's form in the middle, live preview on the right (desktop). The same
// forms as the wizard, in "editor" mode (Save changes instead of continue).
export function ProfileEditor({
  state,
  section,
  sections,
  locked,
}: {
  state: ProviderState;
  section: SectionKey;
  sections: SectionStatus[];
  locked?: string;
}) {
  const [preview, setPreview] = useState<ProfileView>(() => toProfileView(state));
  const onPreview = useCallback((patch: Partial<ProfileView>) => setPreview((p) => ({ ...p, ...patch })), []);
  const current = sections.find((s) => s.key === section);

  return (
    <div className="grid gap-8 xl:grid-cols-[220px_minmax(0,520px)_1fr]">
      <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto xl:flex-col">
        {sections.map((s) => (
          <Link
            key={s.key}
            href={`/provider/profile?section=${s.key}`}
            aria-current={s.key === section ? "page" : undefined}
            scroll={false}
            className={cn(
              "flex shrink-0 items-center justify-between gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              s.key === section ? "bg-warm-100 text-text-primary" : "text-text-secondary hover:bg-warm-100/70",
            )}
          >
            {s.title}
            {!s.complete && <CircleAlertIcon aria-label="Incomplete" className="size-4 text-amber-600" />}
          </Link>
        ))}
      </nav>

      <section className="flex flex-col gap-6 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
        <h2 className="type-ui-title text-text-primary">{current?.title}</h2>
        {locked ? (
          <p role="status" className="rounded-field bg-sky-50 px-4 py-3 type-small text-sky-950">
            {locked}
          </p>
        ) : (
          <SectionForm key={section} section={section} state={state} mode="editor" onPreview={onPreview} />
        )}
      </section>

      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <ProviderProfileView profile={preview} mode="preview" />
        </div>
      </aside>
    </div>
  );
}
