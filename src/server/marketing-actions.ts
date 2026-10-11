"use server";

import { headers } from "next/headers";
import { dbReady } from "@/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resubscribe, unsubscribe } from "./marketing";

export type UnsubscribeState = { unsubscribed?: boolean; error?: string } | null;

/** The button on /unsubscribe/[token]. */
export async function setMarketingEmail(_prev: UnsubscribeState, form: FormData): Promise<UnsubscribeState> {
  const token = String(form.get("token") ?? "");
  const subscribe = form.get("subscribe") === "1";
  if (!(await rateLimit("unsubscribe", clientIp(await headers()), 30, "10 m")).ok) {
    return { unsubscribed: subscribe, error: "Too many attempts. Please wait a few minutes and try again." };
  }
  await dbReady;
  const ok = subscribe ? await resubscribe(token) : await unsubscribe(token);
  if (!ok) return { unsubscribed: subscribe, error: "This link doesn't work. Try the one in the email again." };
  return { unsubscribed: !subscribe };
}
