import type { Metadata } from "next";
import { getPendingEmail } from "@/server/auth/pending-email";
import { getSession } from "@/server/auth/session";
import { ResetLinkSent } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Link sent — PsychMind" };

export default async function ResetLinkSentPage() {
  const email = (await getPendingEmail()) || (await getSession())?.user.email || "";
  return (
    <>
      <ResetLinkSent email={email} />
    </>
  );
}
