import "server-only";
import { cookies } from "next/headers";

// Which address we just emailed (for "Check your email" / "Link sent"), kept
// in a short-lived httpOnly cookie instead of the URL — URLs end up in
// history, logs and analytics, and an email address is personal data.
const NAME = "psychmind_pending_email";

export async function setPendingEmail(email: string) {
  (await cookies()).set(NAME, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function getPendingEmail() {
  return (await cookies()).get(NAME)?.value ?? "";
}
