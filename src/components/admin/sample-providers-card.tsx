"use client";

import { DatabaseIcon, LoaderCircleIcon } from "lucide-react";
import { useActionState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { addSamples, removeSamples, type SampleState } from "@/server/admin/sample-actions";

// Admin control for the 50 sample providers that preview search and public
// profiles. Copy: TODO(client).
export function SampleProvidersCard({ count }: { count: number }) {
  const [addState, add, adding] = useActionState<SampleState, FormData>(addSamples, null);
  const [removeState, remove, removing] = useActionState<SampleState, FormData>(removeSamples, null);
  const state = removeState ?? addState;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-warm-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warm-100 text-warm-700">
          <DatabaseIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="type-small font-semibold text-text-primary">Sample providers</h2>
          <p className="type-small text-text-tertiary">
            {count
              ? `${count} sample profiles are showing in search. They're labelled as samples and can't be booked.`
              : "Fill search with 50 realistic sample profiles to preview how it looks. They're labelled as samples and can't be booked."}
          </p>
          {state?.message && <p role="status" className="type-small text-emerald-700">{state.message}</p>}
          {state?.error && <p role="alert" className="type-small text-red-700">{state.error}</p>}
        </div>
      </div>
      {count ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" size="sm" className="h-9 shrink-0 px-3.5 text-[13px] text-red-700" disabled={removing}>
              {removing && <LoaderCircleIcon className="animate-spin" />}
              Remove samples
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove all {count} sample providers?</AlertDialogTitle>
              <AlertDialogDescription>
                They disappear from search and profiles right away. Real providers aren&apos;t affected, and you can add the samples
                back at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <form action={remove}>
                <AlertDialogAction type="submit">Remove samples</AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <form action={add}>
          <Button type="submit" size="sm" className="h-9 shrink-0 px-3.5 text-[13px]" disabled={adding}>
            {adding && <LoaderCircleIcon className="animate-spin" />}
            {adding ? "Adding…" : "Add 50 sample providers"}
          </Button>
        </form>
      )}
    </section>
  );
}
