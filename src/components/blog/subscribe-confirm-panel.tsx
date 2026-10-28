"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthTitle, FormAlert, SubmitButton } from "@/components/auth/fields";
import { confirmBlogSubscription, type ConfirmState } from "@/server/blog/subscribe-actions";

// The link in the blog's confirmation email lands here. Opening the page changes
// nothing (link scanners open links too); one press of the button subscribes.
// TODO(client): copy.
export function SubscribeConfirmPanel({ token, known }: { token: string; known: boolean }) {
  const [state, action] = useActionState<ConfirmState, FormData>(confirmBlogSubscription, null);
  if (state?.confirmed) {
    return (
      <div className="flex flex-col gap-6" data-testid="subscribe-confirmed">
        <AuthTitle
          title="You're subscribed"
          description="New posts from the PsychMind blog will come to your inbox. Every email has a link to stop them."
        />
        <Link href="/blog" className="type-ui-small text-warm-600 underline underline-offset-2 hover:text-warm-900">
          Back to the blog
        </Link>
      </div>
    );
  }
  if (!known) {
    return (
      <AuthTitle
        title="This link doesn't work"
        description="It may have expired or already been used. You can subscribe again from the blog."
      />
    );
  }
  return (
    <div className="flex flex-col gap-6" data-testid="subscribe-confirm">
      <AuthTitle title="Confirm your subscription" description="Get new posts from the PsychMind blog by email." />
      <FormAlert message={state?.error} />
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <SubmitButton pendingLabel="Confirming…">Confirm subscription</SubmitButton>
      </form>
    </div>
  );
}
