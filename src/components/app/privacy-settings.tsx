"use client";

import { DownloadIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount, type DeleteAccountState } from "@/server/account/actions";

// Security and privacy controls shared by the patient and provider settings
// pages: two-step login, "download my data" and "delete my account".
// All copy is new — TODO(client).

function Row({ title, description, children }: { title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex max-w-[440px] flex-col gap-1">
        <h3 className="type-small font-semibold text-text-primary">{title}</h3>
        <p className="type-small text-text-tertiary">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Deleting…" : "Delete my account"}
    </Button>
  );
}

export function PrivacySettings({
  hasPassword,
  twoFactorEnabled,
  isProvider,
}: {
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  isProvider: boolean;
}) {
  const [state, action] = useActionState<DeleteAccountState, FormData>(deleteAccount, null);

  return (
    <section aria-labelledby="privacy-title" className="flex max-w-[640px] flex-col gap-5 rounded-card border border-warm-200 bg-white p-6 sm:p-8">
      <h2 id="privacy-title" className="type-title text-text-primary">
        Privacy &amp; security
      </h2>
      <div className="flex flex-col divide-y divide-warm-200">
        <Row
          title="Two-step login"
          description="Ask for a code from an authenticator app on your phone each time you log in."
        >
          {twoFactorEnabled ? (
            <Badge variant="success">
              <ShieldCheckIcon />
              On
            </Badge>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/two-factor/setup">Turn on</Link>
            </Button>
          )}
        </Row>
        <Row title="Download your data" description="A copy of everything PsychMind stores about your account, as a file.">
          <Button asChild variant="secondary">
            <a href="/api/account/export" download>
              <DownloadIcon />
              Download
            </a>
          </Button>
        </Row>
        <Row
          title="Delete your account"
          description={
            isProvider
              ? "Removes your profile from PsychMind, cancels your subscription and deletes your documents. This can't be undone."
              : "Removes your account and everything in it. This can't be undone."
          }
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="text-red-700 hover:text-red-800">
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <form action={action} className="flex flex-col gap-5">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isProvider
                      ? "Your profile will disappear from PsychMind, your subscription will be cancelled, and your license documents and photo will be deleted. "
                      : "Your account and everything in it will be deleted. "}
                    This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <input type="hidden" name="hasPassword" value={hasPassword ? "1" : "0"} />
                <div className="flex flex-col gap-1.5">
                  {hasPassword ? (
                    <>
                      <Label htmlFor="delete-password">Enter your password to confirm</Label>
                      <Input id="delete-password" name="password" type="password" autoComplete="current-password" required />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
                      <Input id="delete-confirm" name="confirm" autoComplete="off" required />
                    </>
                  )}
                  {state?.error && (
                    <p role="alert" className="type-caption text-red-700">
                      {state.error}
                    </p>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <DeleteButton />
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
      </div>
    </section>
  );
}
