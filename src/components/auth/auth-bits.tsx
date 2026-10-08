"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { FormAlert } from "./fields";

/** Remembers only *how* someone signed in (never the address) for a "Last used" hint. */
const LAST_USED_KEY = "psychmind:last-auth";
export function rememberMethod(method: "google" | "email") {
  try {
    localStorage.setItem(LAST_USED_KEY, method);
  } catch {}
}
const noopSubscribe = () => () => {};
/** The remembered sign-in method, read without a render-time effect. */
export function useLastUsed() {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(LAST_USED_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
}

export function LastUsed() {
  return (
    <span className="absolute -top-2 right-3 rounded-md bg-warm-900 px-1.5 py-0.5 text-[10.5px] leading-none font-medium text-white">
      Last used
    </span>
  );
}

/** "Continue with Google". Disabled (with a hint in dev) until Google keys are set. */
export function GoogleSignIn({ enabled, intent }: { enabled: boolean; intent?: "provider" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastUsed = useLastUsed() === "google";

  const go = async () => {
    rememberMethod("google");
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: intent ? `/auth/continue?intent=${intent}` : "/auth/continue",
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setError("Google sign-in didn't work. Please try again or use your email.");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        type="button"
        fullWidth
        onClick={go}
        disabled={!enabled || pending}
        title={enabled ? undefined : "Google sign-in isn't set up yet"}
        className="h-10 text-[14px] shadow-none"
      >
        {pending ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/login/google-icon.svg" alt="" width={16} height={16} />
        )}
        Continue with Google
        {lastUsed && <LastUsed />}
      </Button>
      {!enabled && process.env.NODE_ENV !== "production" && (
        <p className="text-center type-ui-caption text-warm-400">Dev: add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to enable.</p>
      )}
      <FormAlert message={error ?? undefined} />
    </div>
  );
}
