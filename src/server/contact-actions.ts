"use server";

import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/server/email";
import { contactMessageEmail } from "@/server/emails";

// The contact page's form: checked field by field (the errors say how to fix each),
// rate-limited per IP, with a honeypot, then emailed to the team (CONTACT_TO_EMAIL),
// replies going to the sender. Locally it lands in /dev/mail. Copy: TODO(client).

export type ContactState = {
  sent?: true;
  /** Where the reply will go (shown in the sent state). */
  sentTo?: string;
  error?: string;
  fieldErrors?: Partial<Record<"firstName" | "lastName" | "email" | "message", string>>;
  values?: Record<string, string>;
} | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TO = process.env.CONTACT_TO_EMAIL || "goingwilson@gmail.com";

export async function sendContactMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // a field people never see: bots that fill it are told it worked
  if (String(form.get("company") ?? "")) return { sent: true };
  const value = (k: string) => String(form.get(k) ?? "").trim();
  const values = {
    firstName: value("firstName"),
    lastName: value("lastName"),
    email: value("email"),
    subject: value("subject"),
    message: value("message"),
  };

  const fieldErrors: NonNullable<ContactState>["fieldErrors"] = {};
  if (!values.firstName) fieldErrors.firstName = "Enter your first name.";
  if (!values.lastName) fieldErrors.lastName = "Enter your last name.";
  if (!EMAIL.test(values.email) || values.email.length > 254) fieldErrors.email = "Enter a valid email, like name@example.com.";
  if (!values.message) fieldErrors.message = "Write a message for us.";
  else if (values.message.length > 5000) fieldErrors.message = "Keep your message under 5,000 characters.";
  if (values.subject.length > 200) values.subject = values.subject.slice(0, 200);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const limit = await rateLimit("contact", clientIp(await headers()), 5, "1 h");
  if (!limit.ok) return { error: "Too many messages from here. Please try again in an hour.", values };

  try {
    await sendEmail(contactMessageEmail(TO, values));
  } catch (err) {
    console.error("contact message failed", err instanceof Error ? err.message : err);
    return { error: "We couldn't send your message just now. Please try again.", values };
  }
  return { sent: true, sentTo: values.email };
}
