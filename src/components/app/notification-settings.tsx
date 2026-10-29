"use client";

import { InfoIcon } from "@/components/ui/hugeicons";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { NotificationKind } from "@/lib/notifications";
import { updateNotification } from "@/server/account/settings-actions";
import type { NotificationSetting } from "@/server/notifications";

// Settings → Email notifications, for every role: one switch per optional
// email, saved the moment it's flipped. What can't be turned off is said
// underneath. All copy is new: TODO(client).

export function NotificationSettings({ settings, alwaysSent }: { settings: NotificationSetting[]; alwaysSent: string }) {
  const [optimistic, setOptimistic] = useOptimistic(settings, (current, change: { kind: NotificationKind; enabled: boolean }) =>
    current.map((s) => (s.kind === change.kind ? { ...s, enabled: change.enabled } : s)),
  );
  const [, startTransition] = useTransition();

  const toggle = (kind: NotificationKind, enabled: boolean) =>
    startTransition(async () => {
      setOptimistic({ kind, enabled });
      const result = await updateNotification(kind, enabled).catch(() => ({ ok: false, error: undefined }));
      if (result.ok) toast.success(enabled ? "Turned on" : "Turned off");
      else toast.error(result.error ?? "We couldn't save that. Please try again.");
    });

  return (
    <section aria-labelledby="notifications-title" className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 id="notifications-title" className="type-title text-text-primary">
          Email notifications
        </h2>
        <p className="type-small text-text-tertiary">Choose which emails PsychMind sends you.</p>
      </div>
      <div className="flex flex-col divide-y divide-warm-200">
        {optimistic.map((s) => {
          const id = `notify-${s.kind}`;
          return (
            <div key={s.kind} className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
              <div className="flex max-w-[440px] flex-col gap-1">
                <label htmlFor={id} className="type-small font-medium text-text-primary">
                  {s.label}
                </label>
                <p id={`${id}-description`} className="type-small text-text-tertiary">
                  {s.description}
                </p>
              </div>
              <Switch
                id={id}
                checked={s.enabled}
                onCheckedChange={(checked) => toggle(s.kind, checked)}
                aria-describedby={`${id}-description`}
                className="mt-0.5 data-[state=checked]:bg-blue-600"
              />
            </div>
          );
        })}
      </div>
      <p className="flex gap-2 rounded-field bg-warm-50 p-3 type-small text-text-secondary">
        <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
        {alwaysSent}
      </p>
    </section>
  );
}
