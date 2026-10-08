import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TwoFactorForm } from "@/components/auth/two-factor-forms";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Two-step verification — PsychMind" };

// Step 2 of logging in when two-step login is on. The pending sign-in lives
// in a short-lived signed cookie set after the password step.
export default async function TwoFactorPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const { next } = await searchParams;
  return <TwoFactorForm next={next} />;
}
