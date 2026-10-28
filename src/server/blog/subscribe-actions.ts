"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db, dbReady } from "@/db";
import { blogSubscriber, emailPreference } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { consumeToken, issueToken } from "@/server/account/tokens";
import { sendEmail } from "@/server/email";
import { blogSubscribeConfirmEmail } from "@/server/emails";
import { appUrl } from "@/server/url";

// Subscribing to the blog (the Subscribe button in the blog's header), with a double
// opt-in: asking makes a pending row and emails a link; only the link's button
// confirms it. The answer to asking is the same whether the address was new, pending
// or already subscribed, so the form can't be used to find out who reads the blog.
// Rate-limited per IP and per address, with a honeypot. Copy: TODO(client).

export type SubscribeState = { sent?: true; error?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAYS_3 = 3 * 24 * 60 * 60;

export async function subscribeToBlog(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  // a field people never see: bots that fill it are told it worked
  if (String(form.get("website") ?? "")) return { sent: true };
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { error: "Enter a valid email address." };

  const ip = clientIp(await headers());
  const byIp = await rateLimit("blog-subscribe-ip", ip, 6, "1 h");
  const byEmail = await rateLimit("blog-subscribe-email", email, 3, "1 d");
  if (!byIp.ok || !byEmail.ok) return { error: "Too many tries. Please wait a little and try again." };

  await dbReady;
  const [row] = await db.select({ confirmedAt: blogSubscriber.confirmedAt }).from(blogSubscriber).where(eq(blogSubscriber.email, email));
  const [pref] = await db
    .select({ optedOut: emailPreference.marketingOptOutAt })
    .from(emailPreference)
    .where(eq(emailPreference.email, email));
  // already subscribed (and not since unsubscribed): nothing to send
  if (row?.confirmedAt && !pref?.optedOut) return { sent: true };

  await db.insert(blogSubscriber).values({ email }).onConflictDoNothing();
  const token = await issueToken("blog-subscribe", email, email, DAYS_3);
  try {
    await sendEmail(blogSubscribeConfirmEmail(email, await appUrl(`/subscribe/${token}`)));
  } catch (err) {
    console.error("blog subscription email failed", err instanceof Error ? err.message : err);
    return { error: "We couldn't send the email just now. Please try again." };
  }
  return { sent: true };
}

export type ConfirmState = { confirmed?: true; error?: string } | null;

/** The confirm page's button: uses the link up and subscribes its address (clearing
 *  an earlier marketing opt-out, since this is a fresh yes). */
export async function confirmBlogSubscription(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const ip = clientIp(await headers());
  if (!(await rateLimit("blog-subscribe-confirm", ip, 20, "1 h")).ok) {
    return { error: "Too many tries. Please wait a little and try again." };
  }
  const email = await consumeToken("blog-subscribe", String(form.get("token") ?? ""));
  if (!email) return { error: "This link has expired or was already used. Subscribe again from the blog." };
  await db
    .insert(blogSubscriber)
    .values({ email, confirmedAt: new Date() })
    .onConflictDoUpdate({ target: blogSubscriber.email, set: { confirmedAt: new Date() } });
  await db.update(emailPreference).set({ marketingOptOutAt: null }).where(eq(emailPreference.email, email));
  return { confirmed: true };
}
