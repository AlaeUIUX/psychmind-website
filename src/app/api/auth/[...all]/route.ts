import { toNextJsHandler } from "better-auth/next-js";
import { dbReady } from "@/db";
import { auth } from "@/server/auth";

// Better Auth's endpoints: sign-in/up, verification, password reset, Google
// OAuth callback and (when configured) the Stripe webhook at
// /api/auth/stripe/webhook.
const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
  await dbReady;
  return handler.GET(request);
}

export async function POST(request: Request) {
  await dbReady;
  return handler.POST(request);
}
