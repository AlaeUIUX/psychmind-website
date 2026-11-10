"use server";

import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { confirmRecoveryContact, disputeRecovery } from "./recovery";

// The buttons behind the two recovery links: confirming the new contact
// address, and the account owner's "This wasn't me". Buttons (not the links
// themselves) so mail scanners can't spend them. Copy approved by the owner, 2026-11-10.

export type RecoveryLinkState = { ok: true; alreadyClosed?: boolean } | { ok: false; error: string } | null;

const EXPIRED = "This link has expired or was already used.";

export async function confirmRecoveryContactAction(_prev: RecoveryLinkState, form: FormData): Promise<RecoveryLinkState> {
  if (!(await rateLimit("recovery-link", clientIp(await headers()), 20, "1 h")).ok) return { ok: false, error: "Too many tries. Please wait a little." };
  const done = await confirmRecoveryContact(String(form.get("token") ?? ""));
  return done ? { ok: true } : { ok: false, error: EXPIRED };
}

export async function disputeRecoveryAction(_prev: RecoveryLinkState, form: FormData): Promise<RecoveryLinkState> {
  if (!(await rateLimit("recovery-link", clientIp(await headers()), 20, "1 h")).ok) return { ok: false, error: "Too many tries. Please wait a little." };
  const done = await disputeRecovery(String(form.get("token") ?? ""));
  return done ? { ok: true, alreadyClosed: done.alreadyClosed } : { ok: false, error: EXPIRED };
}
