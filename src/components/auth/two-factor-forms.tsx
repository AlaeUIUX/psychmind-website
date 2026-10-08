"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { renderSVG } from "uqr";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  confirmTwoFactorSetup,
  startTwoFactorSetup,
  verifyTwoFactor,
  type AuthState,
  type TwoFactorSetupState,
} from "@/server/auth/actions";
import { AuthField, AuthTitle, FormAlert, PasswordInput, SubmitButton, TextInput } from "./fields";

// Two-step login screens: the code challenge after the password, and the
// one-time setup admins must finish before the admin area opens.
// All copy here is new — TODO(client).

function CodeInput({ error, backup }: { error?: string; backup?: boolean }) {
  return (
    <TextInput
      id="code"
      error={error}
      autoFocus
      required
      inputMode={backup ? "text" : "numeric"}
      autoComplete="one-time-code"
      pattern={backup ? undefined : "[0-9]*"}
      maxLength={backup ? 20 : 6}
      placeholder={backup ? "xxxxx-xxxxx" : "123456"}
      className="type-ui-mono tracking-[0.3em]"
    />
  );
}

/** After a correct password: the 6-digit code (or a backup code). */
export function TwoFactorForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(verifyTwoFactor, null);
  const [backup, setBackup] = useState(false);
  const expired = state?.values?.expired === "1";

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle
        title="Two-step verification"
        description={
          backup
            ? "Enter one of the backup codes you saved when you set up two-step login. Each code works once."
            : "Open your authenticator app and enter the 6-digit code for PsychMind."
        }
      />
      <form action={action} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <input type="hidden" name="method" value={backup ? "backup" : "totp"} />
        <FormAlert message={state?.error} />
        {expired ? (
          <Button asChild fullWidth className="h-10">
            <Link href="/login">Log in again</Link>
          </Button>
        ) : (
          <>
            <AuthField id="code" label={backup ? "Backup code" : "Authentication code"} error={state?.fieldErrors?.code}>
              <CodeInput key={backup ? "backup" : "totp"} backup={backup} error={state?.fieldErrors?.code} />
            </AuthField>
            <div className="pt-1">
              <SubmitButton pendingLabel="Checking…">Verify</SubmitButton>
            </div>
          </>
        )}
      </form>
      {!expired && (
        <button
          type="button"
          onClick={() => setBackup((b) => !b)}
          className="self-start type-ui-small text-warm-600 underline-offset-4 hover:text-warm-900 hover:underline"
        >
          {backup ? "Use your authenticator app instead" : "Lost your phone? Use a backup code"}
        </button>
      )}
    </div>
  );
}

/** The secret from an otpauth:// URI, in groups of four for typing by hand. */
function manualKey(uri: string) {
  const secret = new URL(uri).searchParams.get("secret") ?? "";
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

function BackupCodes({ codes, home }: { codes: string[]; home: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const blob = new Blob([`PsychMind backup codes\nEach code works once.\n\n${text}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "psychmind-backup-codes.txt" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle
        eyebrow="Step 3 of 3"
        title="Save your backup codes"
        description="If you lose your phone, each of these codes lets you in once. Keep them somewhere safe, like a password manager. You won't see them again."
      />
      <FormAlert tone="success" message="Two-step login is on." />
      <ol className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-warm-200 bg-warm-50 px-5 py-4" data-testid="backup-codes">
        {codes.map((c) => (
          <li key={c} className="type-ui-mono text-warm-900">
            {c}
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="h-9 flex-1 text-[14px]" onClick={copy}>
          {copied ? <CheckIcon className="text-emerald-600" /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" variant="secondary" className="h-9 flex-1 text-[14px]" onClick={download}>
          <DownloadIcon />
          Download
        </Button>
      </div>
      <label className="flex items-start gap-3 type-ui-small text-warm-700">
        <Checkbox checked={saved} onCheckedChange={(v) => setSaved(v === true)} className="mt-0.5" />
        I&apos;ve saved my backup codes somewhere safe.
      </label>
      <Button asChild={saved} disabled={!saved} fullWidth className="h-10">
        {saved ? <Link href={home}>Continue</Link> : <span>Continue</span>}
      </Button>
    </div>
  );
}

/** One-time setup: password → scan the QR code and confirm → backup codes. */
export function TwoFactorSetup({ home, required, alreadyOn }: { home: string; required: boolean; alreadyOn: boolean }) {
  const [state, action] = useActionState<TwoFactorSetupState, FormData>(
    (prev, form) => (form.get("step") === "confirm" ? confirmTwoFactorSetup(prev, form) : startTwoFactorSetup(prev, form)),
    null,
  );
  const qr = state?.totpURI ? renderSVG(state.totpURI, { border: 1 }) : null;

  if (state?.enabled && state.backupCodes) return <BackupCodes codes={state.backupCodes} home={home} />;

  if (alreadyOn) {
    return (
      <div className="flex flex-col gap-7">
        <AuthTitle title="Two-step login is on" description="You'll be asked for a code from your authenticator app each time you log in." />
        <Button asChild fullWidth className="h-10">
          <Link href={home}>Continue</Link>
        </Button>
      </div>
    );
  }

  if (state?.totpURI) {
    return (
      <div className="flex flex-col gap-7">
        <AuthTitle
          eyebrow="Step 2 of 3"
          title="Scan this code"
          description="In an authenticator app (Google Authenticator, 1Password, Authy…), add an account and scan the code. Then enter the 6-digit code it shows."
        />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-warm-200 bg-white p-5">
          <div
            className="size-44 [&>svg]:size-full"
            role="img"
            aria-label="QR code for your authenticator app"
            dangerouslySetInnerHTML={{ __html: qr ?? "" }}
          />
          <p className="text-center type-ui-caption text-warm-500">
            Can&apos;t scan it? Enter this key instead:
            <br />
            <span className="type-ui-mono text-warm-900 select-all" data-testid="totp-key">
              {manualKey(state.totpURI)}
            </span>
          </p>
        </div>
        <form action={action} noValidate className="flex flex-col gap-4">
          <input type="hidden" name="step" value="confirm" />
          <FormAlert message={state.error} />
          <AuthField id="code" label="Code from your app">
            <CodeInput />
          </AuthField>
          <div className="pt-1">
            <SubmitButton pendingLabel="Checking…">Turn on two-step login</SubmitButton>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <AuthTitle
        eyebrow="Step 1 of 3"
        title="Set up two-step login"
        description={
          required
            ? "Admin accounts can see providers' documents, so they need a second step: a code from an app on your phone, every time you log in."
            : "Add a second step to logging in: a code from an app on your phone."
        }
      />
      <form action={action} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="step" value="start" />
        <FormAlert message={state?.error} />
        <AuthField id="password" label="Confirm your password">
          <PasswordInput placeholder="Enter your password" />
        </AuthField>
        <div className="pt-1">
          <SubmitButton pendingLabel="Checking…">Continue</SubmitButton>
        </div>
      </form>
    </div>
  );
}
