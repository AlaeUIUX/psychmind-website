import type { Metadata } from "next";
import { getPendingEmail } from "@/server/auth/pending-email";
import { getSession } from "@/server/auth/session";
import { VerifyEmailPanel } from "@/components/auth/password-forms";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Confirm your email — PsychMind" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const email = (await getPendingEmail()) || (await getSession())?.user.email || "";
  const next = safeNext((await searchParams).next) ?? undefined;
  return (
    <>
      <VerifyEmailPanel email={email} next={next} />
    </>
  );
}
