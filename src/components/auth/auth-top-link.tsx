"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top-right switch between logging in and signing up (Linear/Vercel pattern). */
export function AuthTopLink() {
  const path = usePathname();
  const onSignup = path.startsWith("/signup");
  if (path.startsWith("/verify-email") || path.startsWith("/reset-password") || path.startsWith("/two-factor") || path.startsWith("/request")) return null;
  return (
    <p className="text-[13px] text-warm-600">
      {onSignup ? "Already have an account?" : "New to PsychMind?"}{" "}
      <Link
        href={onSignup ? "/login" : "/signup"}
        className="font-medium text-warm-900 underline-offset-4 hover:underline"
      >
        {onSignup ? "Log in" : "Create account"}
      </Link>
    </p>
  );
}
