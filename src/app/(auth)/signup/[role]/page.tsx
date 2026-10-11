import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AgeBlocked } from "@/components/auth/age-blocked";
import { FormAlert } from "@/components/auth/fields";
import { SignUpForm } from "@/components/auth/signup-form";
import { AGE_BLOCK_COOKIE } from "@/lib/age";
import { authFeatures } from "@/server/auth/features";

export const metadata: Metadata = { title: "Create your account — PsychMind" };

export function generateStaticParams() {
  return [{ role: "patient" }, { role: "provider" }];
}

export default async function SignUpRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { role } = await params;
  if (role !== "patient" && role !== "provider") notFound();
  // Patients signing up from a provider page (to save them) go back there.
  const { next, error } = await searchParams;
  // An under-age answer on the age screen closes sign-up on this browser for a day.
  if ((await cookies()).get(AGE_BLOCK_COOKIE)) return <AgeBlocked />;
  // Better Auth sends a failed Google sign-up back here with ?error=… TODO(client): copy.
  const googleError = error
    ? error === "access_denied"
      ? "Google sign-in was cancelled. You can try again or use your email."
      : error === "AGE_REQUIRED"
        ? "Your date of birth check expired. Try “Continue with Google” again."
        : "We couldn't sign you up with Google. Please try again or use your email."
    : undefined;
  return (
    <>
      {googleError && (
        <div className="mb-6">
          <FormAlert message={googleError} />
        </div>
      )}
      <SignUpForm role={role} googleEnabled={authFeatures.google} next={role === "patient" ? next : undefined} />
    </>
  );
}
