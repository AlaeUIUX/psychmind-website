"use client";

import { ArrowLeftIcon, LifeBuoyIcon, LoaderCircleIcon, MailIcon, ShieldCheckIcon } from "@/components/ui/hugeicons";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthField, FormAlert, PasswordInput, SubmitButton, TextInput } from "@/components/auth/fields";
import { SentTo } from "@/components/auth/password-forms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  changePassword,
  setPassword,
  startEmailChange,
  startEmailChangeWithCode,
  type SettingsState,
} from "@/server/account/settings-actions";

// Settings → Login, for every role: your email (change it with two proofs),
// your password (change it, or add one to a Google account) and log out.
// When the old inbox is gone, the authenticator app stands in for it; without
// one, the way back is support (/account-recovery). All copy is new: TODO(client).

const compact = "h-9 px-3.5 text-[13px]";

function Row({ title, description, children }: { title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex min-w-0 max-w-[440px] flex-col gap-1">
        <h3 className="type-small font-medium text-text-primary">{title}</h3>
        <div className="type-small break-words text-text-tertiary">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function LoginSettings({
  email,
  hasPassword,
  twoFactorEnabled,
  role,
  signOutAction,
}: {
  email: string;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  role: "patient" | "provider" | "admin";
  signOutAction: () => Promise<void>;
}) {
  return (
    <section aria-labelledby="login-title" className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
      <h2 id="login-title" className="type-title text-text-primary">
        Login
      </h2>
      <div className="flex flex-col divide-y divide-warm-200">
        <Row title="Email" description={<span data-testid="account-email" className="text-text-primary">{email}</span>}>
          <ChangeEmailDialog email={email} hasPassword={hasPassword} twoFactorEnabled={twoFactorEnabled} role={role} />
        </Row>
        <Row
          title="Password"
          description={
            hasPassword
              ? "Changing it logs you out on every other device."
              : "You log in with Google. Add a password to log in with your email too."
          }
        >
          <PasswordDialog hasPassword={hasPassword} role={role} />
        </Row>
        <Row title="Log out" description="End your session on this device.">
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="sm" className={compact}>
              Log out
            </Button>
          </form>
        </Row>
      </div>
    </section>
  );
}

type EmailStep = "intro" | "sent" | "lost";

function ChangeEmailDialog({
  email,
  hasPassword,
  twoFactorEnabled,
  role,
}: {
  email: string;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  role: "patient" | "provider" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<EmailStep>("intro");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await startEmailChange();
      if (result?.ok) setStep("sent");
      else setError(result?.error ?? "Something went wrong. Please try again.");
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTimeout(() => (setStep("intro"), setError(undefined)), 200);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className={compact} aria-label="Change email">
          Change
        </Button>
      </DialogTrigger>
      <DialogContent className="app-ui sm:max-w-[440px]">
        {step === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle>Change your email</DialogTitle>
              <DialogDescription>
                First, confirm it&apos;s you: we&apos;ll send a link to your current email. Then you&apos;ll choose the new one, and confirm it too.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-xl border border-warm-200 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-700">
                <MailIcon className="size-[18px]" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="type-ui-caption text-warm-500">Current email</span>
                <span className="truncate type-ui-label text-warm-900">{email}</span>
              </div>
            </div>
            <FormAlert message={error} />
            <div className="flex flex-col gap-3">
              <Button type="button" fullWidth onClick={send} disabled={pending} aria-busy={pending || undefined} className="h-10 text-[14px]">
                {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
                {pending ? "Sending…" : "Send verification link"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("lost")}
                className="self-center type-ui-small font-medium text-warm-600 underline-offset-4 hover:text-warm-900 hover:underline"
              >
                Can&apos;t access this email?
              </button>
            </div>
          </>
        )}

        {step === "sent" && (
          <>
            <DialogHeader>
              <DialogTitle>Check your inbox</DialogTitle>
              <DialogDescription>Open the link we sent to choose your new email. You can close this window.</DialogDescription>
            </DialogHeader>
            <SentTo email={email} what="Verification link" expires="30 min" />
            <FormAlert message={error} />
            <p className="type-ui-small text-warm-600">
              Didn&apos;t get it? Check your spam folder or{" "}
              <button type="button" onClick={send} disabled={pending} className="font-medium text-warm-900 underline underline-offset-4 disabled:text-warm-400">
                {pending ? "sending…" : "send it again"}
              </button>
              .
            </p>
          </>
        )}

        {step === "lost" && (
          <LostEmail email={email} hasPassword={hasPassword} twoFactorEnabled={twoFactorEnabled} role={role} onBack={() => setStep("intro")} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex w-fit items-center gap-1.5 type-ui-small text-warm-500 hover:text-warm-900">
      <ArrowLeftIcon className="size-3.5" />
      Back
    </button>
  );
}

/** The old inbox is gone: the authenticator app proves it's them, or support does. */
function LostEmail({
  email,
  hasPassword,
  twoFactorEnabled,
  role,
  onBack,
}: {
  email: string;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  role: "patient" | "provider" | "admin";
  onBack: () => void;
}) {
  const [state, action] = useActionState<SettingsState, FormData>(startEmailChangeWithCode, null);
  const fe = state?.fieldErrors ?? {};
  const supportHref = `/account-recovery?email=${encodeURIComponent(email)}`;

  if (role === "admin" && !twoFactorEnabled) {
    // Unreachable in practice: admins can't open Settings without two-step login.
    return null;
  }

  return (
    <>
      <BackButton onClick={onBack} />
      {twoFactorEnabled ? (
        <>
          <DialogHeader>
            <DialogTitle>Use your authenticator instead</DialogTitle>
            <DialogDescription>
              Two-step login is on, so your authenticator app can prove it&apos;s you in place of your email.
            </DialogDescription>
          </DialogHeader>
          <form action={action} noValidate className="flex flex-col gap-4">
            <FormAlert message={state?.error} />
            {hasPassword && (
              <AuthField id="password" label="Your password" error={fe.password}>
                <PasswordInput error={fe.password} />
              </AuthField>
            )}
            <AuthField id="code" label="Code from your app" error={fe.code}>
              <TextInput
                id="code"
                error={fe.code}
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                className="type-ui-mono tracking-[0.3em]"
              />
            </AuthField>
            <SubmitButton pendingLabel="Checking…">Continue</SubmitButton>
          </form>
          <p className="type-ui-small text-warm-600">
            {role === "admin" ? (
              "Lost your authenticator too? Ask another admin to reset your access from Admin → Admins."
            ) : (
              <>
                Lost your authenticator too?{" "}
                <Link href={supportHref} className="font-medium text-warm-900 underline underline-offset-4">
                  Contact support
                </Link>
                .
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>Can&apos;t access your email?</DialogTitle>
            <DialogDescription>
              Without that inbox or two-step login, we can&apos;t confirm it&apos;s you online. Our support team can check who you are and move your
              account to a new email.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 rounded-xl border border-warm-200 p-4 type-ui-small text-warm-700">
            <li className="flex gap-2.5">
              <LifeBuoyIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-warm-500" />
              {role === "provider"
                ? "You'll need a photo of your government ID. We compare it with the license on your profile."
                : "A photo of your ID helps us verify you faster, but it's optional."}
            </li>
            <li className="flex gap-2.5">
              <ShieldCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-warm-500" />
              Next time, turn on two-step login and you can change your email here without support.
            </li>
          </ul>
          <Button asChild fullWidth className="h-10 text-[14px]">
            <Link href={supportHref}>Contact support</Link>
          </Button>
        </>
      )}
    </>
  );
}

function PasswordDialog({ hasPassword, role }: { hasPassword: boolean; role: "patient" | "provider" | "admin" }) {
  const [open, setOpen] = useState(false);
  // Close and confirm once it worked.
  const [state, action] = useActionState<SettingsState, FormData>(async (prev, form) => {
    const result = await (hasPassword ? changePassword : setPassword)(prev, form);
    if (result?.ok) {
      setOpen(false);
      toast.success(hasPassword ? "Password changed" : "Password added");
    }
    return result;
  }, null);
  const fe = state?.fieldErrors ?? {};
  const minimum = role === "admin" ? 12 : 8;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className={compact} aria-label={hasPassword ? "Change password" : "Add password"}>
          {hasPassword ? "Change" : "Add password"}
        </Button>
      </DialogTrigger>
      <DialogContent className="app-ui sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{hasPassword ? "Change your password" : "Add a password"}</DialogTitle>
          <DialogDescription>
            {hasPassword
              ? "Enter your current password, then choose a new one. You'll stay logged in here."
              : "Then you can log in with your email and password, as well as Google."}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted on each open, so nothing typed lingers. */}
        {open && (
          <form action={action} noValidate className="flex flex-col gap-4">
            <FormAlert message={state?.ok ? undefined : state?.error} />
            {hasPassword && (
              <AuthField
                id="currentPassword"
                label="Current password"
                error={fe.currentPassword}
                aside={
                  <Link href="/forgot-password" className="type-ui-caption text-warm-500 underline-offset-4 hover:text-warm-900 hover:underline">
                    Forgot it?
                  </Link>
                }
              >
                <PasswordInput id="currentPassword" error={fe.currentPassword} />
              </AuthField>
            )}
            <AuthField id="newPassword" label="New password" error={fe.newPassword} hint={`At least ${minimum} characters.`}>
              <PasswordInput id="newPassword" error={fe.newPassword} meter autoComplete="new-password" />
            </AuthField>
            <SubmitButton pendingLabel="Saving…">{hasPassword ? "Change password" : "Add password"}</SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
