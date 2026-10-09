"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db, dbReady } from "@/db";
import { providerProfile, sessionRequest } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { formatLabel, requestSchema, sessionTypeLabel, type RequestInput } from "@/lib/requests";
import { getSession, requireRole } from "@/server/auth/session";
import { sendEmail } from "@/server/email";
import { sessionRequestEmail, sessionRequestSentEmail } from "@/server/emails";
import { appUrl } from "@/server/url";
import { recentRequest, requestRecipient, requestTarget } from "./data";

// "Request a session" (Figma B1–B7). Guests and patients alike: the request
// is saved, emailed to the provider's requests address (Reply-To: the
// patient) and confirmed to the patient. Sample providers get the whole flow
// as a demo, without emails. TODO(client): copy.

export type SendResult =
  | { ok: true; email: string; demo: boolean; duplicate: boolean }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<keyof RequestInput, string>> };

const TOO_MANY = "You've sent a lot of requests. Please wait a little and try again.";

export async function sendSessionRequest(input: RequestInput): Promise<SendResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof RequestInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof RequestInput;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const v = parsed.data;
  // Bots fill in the hidden field: say yes, send nothing.
  if (v.website) return { ok: true, email: v.email, demo: false, duplicate: false };

  const ip = clientIp(await headers());
  if (!(await rateLimit("request-ip", ip, 10, "1 h")).ok) return { ok: false, error: TOO_MANY };

  // Signed-in patients send from their verified account email.
  const session = await getSession();
  const patient = session?.user.role === "patient" && session.user.emailVerified ? session.user : null;
  const email = patient?.email ?? v.email;
  if (!(await rateLimit("request-email", email.toLowerCase(), 5, "1 h")).ok) return { ok: false, error: TOO_MANY };

  const target = await requestTarget(v.publicId);
  const recipient = target && (await requestRecipient(v.publicId));
  if (!target || !recipient) return { ok: false, error: "This provider isn't taking requests through PsychMind right now." };
  if (!target.accepting) return { ok: false, error: `${target.first} isn't taking new clients right now.` };
  if (!target.sessionTypes.includes(v.sessionType) || !target.formats.includes(v.format)) {
    return { ok: false, error: `${target.first} doesn't offer that kind of session. Please go back and choose again.` };
  }

  // The same person asking the same provider again within a day: no second email.
  if (await recentRequest(recipient.profileId, email)) return { ok: true, email, demo: target.isSample, duplicate: true };

  await dbReady;
  const [row] = await db
    .insert(sessionRequest)
    .values({
      profileId: recipient.profileId,
      patientId: patient?.id ?? null,
      name: v.name,
      email,
      phone: v.phone ?? null,
      sessionType: v.sessionType,
      format: v.format,
      note: v.note ?? null,
      isDemo: target.isSample,
    })
    .returning({ id: sessionRequest.id });

  if (!target.isSample) {
    try {
      await sendEmail(
        sessionRequestEmail(
          recipient.email,
          target.first,
          { name: v.name, email, phone: v.phone, sessionType: sessionTypeLabel(v.sessionType), format: formatLabel(v.format), note: v.note },
          await appUrl("/provider/requests"),
        ),
      );
    } catch (err) {
      // Without the provider's email the request didn't really go anywhere.
      console.error("session request email failed", err);
      await db.delete(sessionRequest).where(eq(sessionRequest.id, row.id));
      return { ok: false, error: "We couldn't send your request just now. Please try again in a moment." };
    }
    const cta = patient ? { label: "See your requests", url: await appUrl("/account") } : { label: "Back to search", url: await appUrl("/providers") };
    await sendEmail(sessionRequestSentEmail(email, target.name, cta)).catch((err) => console.error("request confirmation email failed", err));
  }

  if (patient) revalidatePath("/account");
  return { ok: true, email, demo: target.isSample, duplicate: false };
}

/** The provider's own bookkeeping: mark a request contacted (or not). */
export async function setRequestContacted(id: string, contacted: boolean) {
  const { user } = await requireRole("provider");
  if (typeof id !== "string" || id.length > 64) return { ok: false as const };
  await dbReady;
  const [profile] = await db.select({ id: providerProfile.id }).from(providerProfile).where(eq(providerProfile.userId, user.id));
  if (!profile) return { ok: false as const };
  await db
    .update(sessionRequest)
    .set({ status: contacted ? "contacted" : "new", contactedAt: contacted ? new Date() : null })
    .where(and(eq(sessionRequest.id, id), eq(sessionRequest.profileId, profile.id)));
  revalidatePath("/provider/requests");
  revalidatePath("/provider");
  return { ok: true as const };
}

export type RequestEmailState = { ok?: boolean; error?: string } | null;

/** Provider settings: where requests are emailed (empty = the account email). */
export async function setRequestEmail(_prev: RequestEmailState, form: FormData): Promise<RequestEmailState> {
  const { user } = await requireRole("provider");
  const raw = String(form.get("requestEmail") ?? "").trim();
  const parsed = z.union([z.literal(""), z.email().max(200)]).safeParse(raw);
  if (!parsed.success) return { error: "Enter a valid email address, or leave it empty to use your account email." };
  await dbReady;
  await db.update(providerProfile).set({ requestEmail: parsed.data || null }).where(eq(providerProfile.userId, user.id));
  revalidatePath("/provider/settings");
  return { ok: true };
}
