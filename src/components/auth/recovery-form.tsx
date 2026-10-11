"use client";

import { cn } from "cn";
import { ArrowLeftIcon, BadgeCheckIcon, FileIcon, LoaderCircleIcon, MailCheckIcon, SearchIcon, UploadIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AuthField, AuthTitle, EmailInput, FormAlert, HoverArrow, TextInput } from "./fields";

// "Can't access your email?": a request to our support team to move an
// account to a new address, for people with no inbox and no authenticator.
// Providers attach a photo ID; patients may. Posted to /api/account-recovery
// (multipart, so the photo fits). All copy is new: TODO(client).

const roles = [
  { value: "patient", title: "I use PsychMind to find care", Icon: SearchIcon },
  { value: "provider", title: "I'm a provider on PsychMind", Icon: BadgeCheckIcon },
] as const;

type Errors = Record<string, string>;

export function RecoveryForm({ signedInEmail, defaultEmail }: { signedInEmail?: string; defaultEmail?: string }) {
  const [role, setRole] = useState<"patient" | "provider" | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (file) form.set("idDocument", file);
    else form.delete("idDocument");
    const next: Errors = {};
    if (!role) next.claimedRole = "Choose one.";
    if (role === "provider" && !file) next.idDocument = "Add a photo of your government ID.";
    if (Object.keys(next).length) return setErrors(next);
    setPending(true);
    setError(undefined);
    setErrors({});
    try {
      const response = await fetch("/api/account-recovery", { method: "POST", body: form });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: Errors };
      if (response.ok && body.ok) setSentTo(String(form.get("contactEmail") ?? ""));
      else {
        setErrors(body.fieldErrors ?? {});
        setError(body.error ?? (body.fieldErrors ? undefined : "Something went wrong. Please try again."));
      }
    } catch {
      setError("We couldn't reach PsychMind. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-7">
        <AuthTitle eyebrow="Request sent" title="We'll be in touch" description="Our support team will check your details and reply by email, usually within 2 business days." />
        <div className="flex items-center gap-3 rounded-xl border border-warm-200 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-700">
            <MailCheckIcon className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="type-ui-label text-warm-900">We&apos;ll reply to</span>
            <span className="truncate type-ui-small text-warm-600" data-testid="recovery-sent-to">
              {sentTo}
            </span>
          </div>
        </div>
        <p className="type-ui-small text-warm-600">For your security, nothing on your account changes until a person has checked who you are.</p>
        <Button asChild variant="secondary" fullWidth className="h-10 text-[14px]">
          <Link href={signedInEmail ? "/auth/continue" : "/login"}>{signedInEmail ? "Back to PsychMind" : "Back to log in"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <Link href={signedInEmail ? "/auth/continue" : "/login"} className="inline-flex w-fit items-center gap-1.5 type-ui-small text-warm-500 hover:text-warm-900">
        <ArrowLeftIcon className="size-3.5" />
        {signedInEmail ? "Back" : "Back to log in"}
      </Link>
      <AuthTitle
        title="Can't access your email?"
        description="If your email was closed or someone else took it over, our support team can move your account to a new address once they've checked who you are."
      />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormAlert message={error} />
        {/* Hidden from people; bots fill it in. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

        {signedInEmail ? (
          <AuthField id="accountEmail" label="Your account">
            <TextInput id="accountEmail" value={signedInEmail} readOnly disabled />
          </AuthField>
        ) : (
          <AuthField id="accountEmail" label="The email on your account" error={errors.accountEmail} hint="The one you can't get into anymore.">
            <EmailInput id="accountEmail" name="accountEmail" error={errors.accountEmail} defaultValue={defaultEmail} autoFocus />
          </AuthField>
        )}
        <AuthField id="contactEmail" label="A new email we can reach you at" error={errors.contactEmail} hint="If we can verify you, your account moves to this address.">
          <EmailInput id="contactEmail" name="contactEmail" error={errors.contactEmail} autoFocus={Boolean(signedInEmail)} />
        </AuthField>
        <AuthField id="fullName" label="Full name" error={errors.fullName}>
          <TextInput id="fullName" error={errors.fullName} autoComplete="name" required />
        </AuthField>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 type-ui-label text-warm-800">Which describes you?</legend>
          <RadioGroupPrimitive.Root
            name="claimedRole"
            value={role}
            onValueChange={(v) => setRole(v as "patient" | "provider")}
            aria-label="Which describes you?"
            className="grid gap-2 sm:grid-cols-2"
          >
            {roles.map(({ value, title, Icon }) => (
              <RadioGroupPrimitive.Item
                key={value}
                value={value}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-white p-3 text-left outline-none transition-[border-color,box-shadow,background-color] duration-200",
                  "focus-visible:ring-4 focus-visible:ring-ring/15",
                  "data-[state=unchecked]:border-warm-200 data-[state=unchecked]:hover:border-warm-300 data-[state=unchecked]:hover:bg-warm-50/60",
                  "data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50/50 data-[state=checked]:shadow-[0_0_0_1px_var(--color-blue-600)]",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-50 text-warm-700">
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 type-ui-small font-medium text-warm-900">{title}</span>
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-warm-300 bg-white shadow-xs transition-colors group-data-[state=checked]:border-blue-600">
                  <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-blue-600" />
                </span>
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
          {errors.claimedRole && (
            <p role="alert" className="type-ui-caption text-red-700">
              {errors.claimedRole}
            </p>
          )}
        </fieldset>

        {role === "provider" && (
          <AuthField id="licenseNumber" label="One of your license numbers" optional>
            <TextInput id="licenseNumber" autoComplete="off" />
          </AuthField>
        )}

        {role && (
          <AuthField
            id="idDocument"
            label="Photo of your government ID"
            optional={role === "patient"}
            error={errors.idDocument}
            hint={
              role === "provider"
                ? "A driver's license or passport. We compare it with your license, then delete it once your request is closed."
                : "Optional, but it helps us verify you faster. Deleted once your request is closed."
            }
          >
            <input
              ref={fileInput}
              id="idDocument"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-warm-200 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-700">
                  <FileIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate type-ui-small text-warm-900">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove file"
                  onClick={() => {
                    setFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  <XIcon />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="secondary" className="h-10 w-full justify-center shadow-none" onClick={() => fileInput.current?.click()}>
                <UploadIcon />
                Choose a file
              </Button>
            )}
          </AuthField>
        )}

        <AuthField id="details" label="Anything that helps us confirm it's you" optional hint="For example, roughly when you signed up. Please don't include health information.">
          <Textarea id="details" name="details" maxLength={1000} rows={3} className="shadow-none" />
        </AuthField>

        <Button type="submit" size="default" fullWidth disabled={pending} aria-busy={pending || undefined} className="h-10 text-[14px]">
          {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
          {pending ? "Sending…" : "Send request"}
          {!pending && <HoverArrow />}
        </Button>
      </form>
    </div>
  );
}
