import type { Metadata } from "next";
import { getPendingEmail } from "@/server/auth/pending-email";
import { getSession } from "@/server/auth/session";
import { VerifyEmailPanel } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Confirm your email — PsychMind" };

export default async function VerifyEmailPage() {
  const email = (await getPendingEmail()) || (await getSession())?.user.email || "";
  return (
    <>
      <VerifyEmailPanel email={email} />
    </>
  );
}
