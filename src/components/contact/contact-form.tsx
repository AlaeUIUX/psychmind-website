"use client";

import { useActionState, useState } from "react";
import { AuthField, AuthTitle, EmailInput, FormAlert, SubmitButton, TextInput } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { MailCheckIcon } from "@/components/ui/hugeicons";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage, type ContactState } from "@/server/contact-actions";

// The contact form in the portal's form style (the log-in pages' parts, auth/fields.tsx):
// 13px labels, 40px fields, an inline error under each field that needs fixing, an alert
// for anything else, and once it's sent, the portal's "sent" view. Sent through
// sendContactMessage (server/contact-actions.ts).

export function ContactForm() {
  // a new message starts a fresh form (and a fresh action state)
  const [round, setRound] = useState(0);
  return <Form key={round} onAgain={() => setRound((r) => r + 1)} />;
}

function Form({ onAgain }: { onAgain: () => void }) {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessage, null);
  const fe = state?.fieldErrors ?? {};
  const v = state?.values ?? {};

  if (state?.sent) {
    return (
      <div className="flex flex-col gap-7 animate-ui-enter">
        <AuthTitle title="Message sent" description="Thanks for reaching out — we'll get back to you soon." />
        {state.sentTo && (
          <div className="flex items-center gap-3 rounded-xl border border-warm-200 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-700">
              <MailCheckIcon className="size-[18px]" />
            </span>
            <div className="flex min-w-0 flex-col">
              {/* TODO(client): new microcopy */}
              <span className="type-ui-label text-warm-900">We&apos;ll reply to</span>
              <span className="truncate type-ui-small text-warm-600" data-testid="contact-sent-to">
                {state.sentTo}
              </span>
            </div>
          </div>
        )}
        {/* TODO(client): new microcopy */}
        <Button variant="secondary" fullWidth className="h-10 text-[14px]" onClick={onAgain}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle title="We would love to hear from you" description="Whether you have a question, a thought, or just want to say hello" />
      <form action={action} noValidate className="flex flex-col gap-4">
        <FormAlert message={state?.error} />
        {/* Hidden from people; bots fill it in. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="firstName" label="First name" error={fe.firstName}>
            <TextInput id="firstName" autoComplete="given-name" placeholder="John" defaultValue={v.firstName} error={fe.firstName} required />
          </AuthField>
          <AuthField id="lastName" label="Last name" error={fe.lastName}>
            <TextInput id="lastName" autoComplete="family-name" placeholder="Doe" defaultValue={v.lastName} error={fe.lastName} required />
          </AuthField>
        </div>
        <AuthField
          id="email"
          label="Email"
          error={fe.email}
          hint="We'll use this to contact you. We will not share your email with anyone else."
        >
          <EmailInput error={fe.email} defaultValue={v.email} />
        </AuthField>
        <AuthField id="subject" label="Subject" optional>
          <TextInput id="subject" placeholder="What is this about?" defaultValue={v.subject} maxLength={200} />
        </AuthField>
        <AuthField id="message" label="Message" error={fe.message}>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell what's on your mind..."
            rows={6}
            maxLength={5000}
            defaultValue={v.message}
            aria-invalid={!!fe.message}
            aria-describedby={fe.message ? "message-error" : undefined}
            className="min-h-36 shadow-none"
            required
          />
        </AuthField>
        <div className="mt-2 flex flex-col gap-3">
          <SubmitButton pendingLabel="Sending...">Send message</SubmitButton>
          <p className="text-center type-ui-caption text-warm-500">Your message is private and never shared.</p>
        </div>
      </form>
    </div>
  );
}
