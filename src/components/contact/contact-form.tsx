"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { SendIcon } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";

// Visible focus: the border darkens and a soft brand halo appears, instead of
// the outline simply disappearing.
const inputClasses =
  "w-full rounded-field border border-warm-300/80 bg-white px-4 py-3 type-body text-text-primary shadow-control placeholder:text-text-placeholder transition-[border-color,box-shadow] duration-200 hover:border-warm-300 focus:border-warm-600 focus:shadow-[0_0_0_4px_rgb(192_16_72/0.12)] focus:outline-none";

type Status = "idle" | "submitting" | "success" | "error";

function FieldBlock({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label htmlFor={id} className="type-small font-medium text-text-primary">
        {label}
      </label>
      {children}
      {hint && <p className="type-small text-text-tertiary">{hint}</p>}
    </div>
  );
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <Section spacing="none" className="pb-20 sm:pb-28 md:pb-32">
      <Reveal className="mx-auto w-full max-w-[576px] rounded-card border border-warm-200 bg-warm-50 p-5 shadow-card sm:p-9">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center" role="status">
            <p className="type-h4 text-text-primary">Message sent</p>
            <p className="type-body text-text-tertiary">
              Thanks for reaching out — we&apos;ll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
              <FieldBlock id="firstName" label="First name">
                <input id="firstName" name="firstName" type="text" required autoComplete="given-name" placeholder="John" className={inputClasses} />
              </FieldBlock>
              <FieldBlock id="lastName" label="Last name">
                <input id="lastName" name="lastName" type="text" required autoComplete="family-name" placeholder="Doe" className={inputClasses} />
              </FieldBlock>
            </div>

            <FieldBlock
              id="email"
              label="Email"
              hint="We'll use this to contact you. We will not share your email with anyone else."
            >
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="m@example.com" className={inputClasses} />
            </FieldBlock>

            <FieldBlock id="subject" label="Subject (optional)">
              <input id="subject" name="subject" type="text" placeholder="What is this about?" className={inputClasses} />
            </FieldBlock>

            <FieldBlock id="message" label="Message">
              <textarea
                id="message"
                name="message"
                required
                placeholder="Tell what's on your mind..."
                rows={6}
                className={`${inputClasses} h-[200px] resize-none`}
              />
            </FieldBlock>

            <div className="flex flex-col items-center gap-3 pt-1">
              <p aria-live="polite" className="type-small text-brand-primary empty:hidden">
                {status === "error" && "Something went wrong sending your message. Please try again."}
              </p>
              <Button type="submit" variant="brand" size="lg" fullWidth disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Send message"}
                <SendIcon />
              </Button>
              <p className="type-small text-text-tertiary">Your message is private and never shared.</p>
            </div>
          </form>
        )}
      </Reveal>
    </Section>
  );
}
