"use client";

import { LoaderCircleIcon } from "@/components/ui/hugeicons";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth/client";
import { confirmAgeForGoogle, type AgeCheckState } from "@/server/auth/actions";
import { BirthDateField, FormAlert } from "./fields";

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

/** "Continue with Google". Disabled (with a hint in dev) until Google keys are set.
 *  On sign-up (`ageCheck`) it asks for a date of birth first: a new Google
 *  account is refused without that age screen (server/auth/index.ts). */
export function GoogleSignIn({ enabled, intent, ageCheck, errorPath = "/login" }: { enabled: boolean; intent?: "provider"; ageCheck?: boolean; errorPath?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const router = useRouter();

  const lastUsed = useLastUsed() === "google";

  const go = async () => {
    rememberMethod("google");
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: intent ? `/auth/continue?intent=${intent}` : "/auth/continue",
      // Better Auth adds ?error=<code> (e.g. AGE_REQUIRED, access_denied).
      errorCallbackURL: errorPath,
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
        onClick={ageCheck ? () => setAsking(true) : go}
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
      {ageCheck && (
        <AgeBeforeGoogle
          open={asking}
          onOpenChange={setAsking}
          onPassed={() => {
            setAsking(false);
            go();
          }}
          onBlocked={() => {
            setAsking(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** The age screen as one step before Google. TODO(client): copy. */
function AgeBeforeGoogle({
  open,
  onOpenChange,
  onPassed,
  onBlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPassed: () => void;
  onBlocked: () => void;
}) {
  const [state, action, pending] = useActionState<AgeCheckState, FormData>(confirmAgeForGoogle, null);
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state?.ok) onPassed();
    else if (state?.blocked) onBlocked();
  }, [state, onPassed, onBlocked]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-ui sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Before you continue</DialogTitle>
          <DialogDescription>Enter your date of birth to create your account with Google.</DialogDescription>
        </DialogHeader>
        <form action={action} noValidate className="flex flex-col gap-5">
          <BirthDateField idPrefix="google-" error={state?.error} values={state?.values} />
          <Button type="submit" fullWidth disabled={pending} aria-busy={pending || undefined} className="h-10 text-[14px]">
            {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
            Continue with Google
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
