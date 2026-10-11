"use client";

import { useActionState } from "react";
import { AuthTitle, FormAlert, SubmitButton } from "@/components/auth/fields";
import { setMarketingEmail, type UnsubscribeState } from "@/server/marketing-actions";

// One button, no log-in (CAN-SPAM: opting out can't take more than visiting
// one page). Transactional email (sign-in links, requests, billing) still
// arrives. TODO(client): copy.
export function UnsubscribePanel({ token, known, unsubscribed }: { token: string; known: boolean; unsubscribed: boolean }) {
  const [state, action] = useActionState<UnsubscribeState, FormData>(setMarketingEmail, { unsubscribed });
  if (!known) {
    return (
      <AuthTitle
        title="This link doesn't work"
        description="It may be incomplete. Try the unsubscribe link in the email again, or write to us from the Contact page."
      />
    );
  }
  const out = state?.unsubscribed;
  return (
    <div className="flex flex-col gap-6" data-testid="unsubscribe">
      <AuthTitle
        title={out ? "You're unsubscribed" : "Unsubscribe from marketing emails?"}
        description={
          out
            ? "You won't get PsychMind news or offers anymore. We'll still send emails about your account, like sign-in links and replies to your requests."
            : "You'll stop getting PsychMind news and offers. Emails about your account, like sign-in links and replies to your requests, still arrive."
        }
      />
      <FormAlert message={state?.error} />
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="subscribe" value={out ? "1" : ""} />
        {out ? (
          <SubmitButton pendingLabel="Saving…">Subscribe again</SubmitButton>
        ) : (
          <SubmitButton pendingLabel="Unsubscribing…">Unsubscribe</SubmitButton>
        )}
      </form>
    </div>
  );
}
