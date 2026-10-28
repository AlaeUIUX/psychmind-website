"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CtaArrowIcon, LoaderCircleIcon, MailCheckIcon } from "@/components/ui/hugeicons";
import { Input } from "@/components/ui/input";
import { subscribeToBlog, type SubscribeState } from "@/server/blog/subscribe-actions";

// Subscribing to the blog, from the Subscribe button in its header: an email address,
// then "check your inbox" (the subscription waits for the link we send). The form
// starts fresh each time it opens (the dialog unmounts it when closed). Copy:
// TODO(client).

function Send() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending || undefined} className="shrink-0">
      {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
      {pending ? "Sending…" : "Subscribe"}
      {!pending && <CtaArrowIcon />}
    </Button>
  );
}

function SubscribeForm() {
  const [state, action] = useActionState<SubscribeState, FormData>(subscribeToBlog, null);
  if (state?.sent) {
    return (
      <div className="flex items-start gap-3 rounded-field border border-warm-200 bg-warm-50 p-4" role="status">
        <MailCheckIcon className="mt-0.5 size-5 shrink-0 text-warm-900" />
        <p className="type-small text-text-secondary">
          Check your inbox. We sent a link to confirm your subscription; nothing comes from the blog until you use it.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      {/* a field people never see */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="blog-subscribe-email" className="sr-only">
          Email address
        </label>
        <Input
          id="blog-subscribe-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "blog-subscribe-error" : undefined}
          className="h-10"
        />
        <Send />
      </div>
      {state?.error && (
        <p id="blog-subscribe-error" role="alert" className="type-small text-red-700">
          {state.error}
        </p>
      )}
      <p className="type-caption text-text-tertiary">One email when there&apos;s a new post. Leave any time, with one click.</p>
    </form>
  );
}

export function SubscribeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="type-h4">Subscribe to the blog</DialogTitle>
          <DialogDescription className="type-body text-text-tertiary">
            New posts from the PsychMind team and the providers on PsychMind, in your inbox.
          </DialogDescription>
        </DialogHeader>
        <SubscribeForm />
      </DialogContent>
    </Dialog>
  );
}
