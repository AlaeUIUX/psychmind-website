"use client";

import { useState, type FormEvent } from "react";

const inputClasses =
  "w-full rounded-xl border-[1.5px] border-warm-200 bg-transparent px-5 py-3.5 text-md text-text-primary placeholder:text-text-placeholder shadow-[0px_1.5px_3px_0px_rgba(0,0,0,0.05)] focus:outline-none focus:border-warm-300 transition-colors";

type Status = "idle" | "submitting" | "success" | "error";

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
    <section className="w-full flex justify-center px-4 sm:px-8 py-6">
      <div className="w-full max-w-[576px] rounded-[20px] border-[1.5px] border-warm-200 bg-warm-50 p-6 sm:p-9">
        {status === "success" ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-display text-warm-900 text-display-xs">Message sent</p>
            <p className="text-text-tertiary text-md">
              Thanks for reaching out — we&apos;ll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label htmlFor="firstName" className="text-md font-medium text-text-primary">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder="John"
                  className={inputClasses}
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label htmlFor="lastName" className="text-md font-medium text-text-primary">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  placeholder="Doe"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-md font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="m@example.com"
                className={inputClasses}
              />
              <p className="text-text-tertiary text-sm">
                We&apos;ll use this to contact you. We will not share your email with anyone
                else.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="subject" className="text-md font-medium text-text-primary">
                Subject (optional)
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="What is this about?"
                className={inputClasses}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-md font-medium text-text-primary">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                placeholder="Tell what's on your mind..."
                rows={6}
                className={`${inputClasses} h-[200px] resize-none`}
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              {status === "error" && (
                <p className="text-brand-primary text-sm">
                  Something went wrong sending your message. Please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-brand-primary px-9 py-3.5 text-xl font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {status === "submitting" ? "Sending..." : "Send message"}
                <img src="/images/contact/send-icon.svg" alt="" width={24} height={24} />
              </button>
              <p className="text-text-tertiary text-sm">
                Your message is private and never shared.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
