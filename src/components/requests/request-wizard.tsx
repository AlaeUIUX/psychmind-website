"use client";

import { cn } from "cn";
import { ArrowLeftIcon, LoaderCircleIcon, MapPinIcon, MonitorIcon, SendIcon, UserIcon, UserKeyIcon, UserPlusIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { CrisisStrip } from "@/components/app/crisis-strip";
import { useAuthPanel } from "@/components/auth/auth-context";
import { AuthField, AuthTitle, FormAlert, HoverArrow, TextInput } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatLabel, objectPronoun, sessionTypeLabel, type RequestInput } from "@/lib/requests";
import { sendSessionRequest, type SendResult } from "@/server/requests/actions";
import type { RequestTarget } from "@/server/requests/data";

// "Request a session" (Figma B1–B7) in the portal shell: five short steps,
// then "You're all set". Guests leave their name, phone and email; signed-in
// patients have them filled in and the request saved to "My requests".
// Choices survive a detour through log in / sign up (sessionStorage, this
// tab only). Copy is Figma's; anything new is marked TODO(client).

type Patient = { name: string; email: string } | null;
type Choice = "login" | "signup" | "guest";
type Draft = { sessionType: string; format: string; note: string; name: string; email: string; phone: string; website: string };
type Errors = Partial<Record<keyof RequestInput, string>>;

const STEPS = 5;
const storageKey = (publicId: string) => `psychmind:request:${publicId}`;

function Dashes({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: STEPS }, (_, i) => (
        <span key={i} className={cn("h-1 w-6 rounded-full transition-colors duration-300", i < step ? "bg-blue-600" : "bg-warm-200")} />
      ))}
    </div>
  );
}

function ProviderCard({ target, children }: { target: RequestTarget; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warm-200 bg-warm-50 p-3">
      <div className="flex items-center gap-3">
        {target.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={target.photoUrl} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-warm-100">
            <UserRoundIcon className="size-5 text-warm-400" />
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate type-ui-heading text-warm-900">{target.name}</span>
          <span className="truncate type-ui-small text-warm-600">{target.title}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function Pills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="inline-flex h-7 items-center rounded-md border border-warm-200 bg-white px-2.5 type-ui-label text-warm-700">
          {i}
        </span>
      ))}
    </div>
  );
}

function Continue({ children = "Continue", disabled, pending }: { children?: ReactNode; disabled?: boolean; pending?: boolean }) {
  return (
    <Button type="submit" fullWidth disabled={disabled || pending} aria-busy={pending || undefined} className="h-10 text-[14px]">
      {pending && <LoaderCircleIcon className="size-4 animate-spin" />}
      {children}
      {!pending && <HoverArrow />}
    </Button>
  );
}

const CHOICES = [
  { value: "login", title: "Log in to my account", body: "Continue with your existing account", Icon: UserKeyIcon },
  { value: "signup", title: "Create a free account", body: "Save your request and track sessions", Icon: UserPlusIcon, tag: "Recommended" },
  { value: "guest", title: "Continue as guest", body: "Just leave your email — no account needed", Icon: UserIcon },
] as const;

function Review({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col divide-y divide-warm-100 rounded-xl border border-warm-200">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 px-3.5 py-2.5">
          <dt className="type-ui-caption tracking-wide text-warm-500 uppercase">{label}</dt>
          <dd className="truncate text-right type-ui-body text-warm-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Done({ target, patient, result }: { target: RequestTarget; patient: Patient; result: Extract<SendResult, { ok: true }> }) {
  if (result.duplicate) {
    return (
      <div className="flex flex-col gap-6">
        {/* TODO(client): copy. */}
        <AuthTitle
          eyebrow="Request already sent"
          title={`${target.first} already has your request`}
          description={`You sent ${target.first} a request in the last day, so we didn't send another. They'll be in touch by email or phone.`}
        />
        <Button asChild variant="secondary" fullWidth className="h-10 text-[14px]">
          <Link href="/providers">Back to search</Link>
        </Button>
      </div>
    );
  }
  const steps = [
    ["Check your inbox", "You'll receive a confirmation with the session link and a calendar invite."],
    ["Most providers respond within 2-3 business days?", "You’ll be contacted  directly by email or phone to confirm everything."],
    ...(patient ? [] : [["Want to track your requests?", "Create a free account to manage requests and save provider profiles."]]),
  ];
  return (
    <div className="flex flex-col gap-6">
      <AuthTitle
        eyebrow="Request confirmed"
        title="You're all set"
        description={
          patient
            ? `${target.first} has received your request and will reach out to you directly within 48 hours.`
            : "You’ll be contacted by the provider directly by email or phone to confirm everything."
        }
      />
      {result.demo ? (
        // TODO(client): copy.
        <FormAlert tone="info" message={`${target.name} is a sample provider, so no email was sent. With a real provider, this is where they'd get your request.`} />
      ) : (
        <div className="flex items-start gap-4 rounded-xl border border-warm-200 bg-warm-50 p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="type-ui-heading text-warm-900">We sent an email on your behalf!</p>
            <p className="truncate type-ui-body font-medium text-blue-700">{result.email}</p>
            <p className="type-ui-small text-warm-600">You’ll be contacted directly by email or phone to confirm everything.</p>
          </div>
          <SendIcon className="mt-1 size-6 shrink-0 text-warm-400" />
        </div>
      )}
      <ol className="flex flex-col">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warm-100 type-ui-label text-warm-800">{i + 1}</span>
              {i < steps.length - 1 && <span className="my-1 w-px flex-1 bg-warm-200" />}
            </div>
            <div className="flex flex-col gap-0.5 pt-1 pb-4">
              <p className="type-ui-heading text-warm-900">{title}</p>
              <p className="type-ui-small text-warm-600">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2">
        {patient ? (
          <Button asChild fullWidth className="h-10 text-[14px]">
            <Link href="/account">Check all requests</Link>
          </Button>
        ) : (
          <Button asChild fullWidth className="h-10 text-[14px]">
            <Link href="/signup/patient">Create a free account</Link>
          </Button>
        )}
        <Button asChild variant="secondary" fullWidth className="h-10 text-[14px]">
          <Link href="/providers">Back to search</Link>
        </Button>
      </div>
      {patient && <p className="text-center type-ui-caption text-warm-500">This request has been saved to “My requests”</p>}
    </div>
  );
}

export function RequestWizard({ target, patient, resume }: { target: RequestTarget; patient: Patient; resume: boolean }) {
  const { setRequest } = useAuthPanel();
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [draft, setDraft] = useState<Draft>(() => ({
    sessionType: target.sessionTypes.includes("individuals") ? "individuals" : (target.sessionTypes[0] ?? ""),
    format: target.formats.includes("online") ? "online" : (target.formats[0] ?? ""),
    note: "",
    name: patient?.name ?? "",
    email: patient?.email ?? "",
    phone: "",
    website: "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<Extract<SendResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const her = objectPronoun(target.pronouns);

  // Back from logging in or signing up: pick up where they left off.
  useEffect(() => {
    if (!resume) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey(target.publicId)) ?? "null") as Partial<Draft> | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring this tab's draft once, on arrival
      if (saved) setDraft((d) => ({ ...d, sessionType: saved.sessionType ?? d.sessionType, format: saved.format ?? d.format, note: saved.note ?? d.note }));
      setStep(4);
    } catch {}
  }, [resume, target.publicId]);

  // The portal panel shows the request filling in.
  useEffect(() => {
    setRequest({
      name: target.name,
      title: target.title,
      photoUrl: target.photoUrl,
      from: draft.name.trim().split(/\s+/)[0] ?? "",
      chips: [sessionTypeLabel(draft.sessionType), formatLabel(draft.format)].filter(Boolean),
      sent: !!result && !result.duplicate,
    });
  }, [target, draft.name, draft.sessionType, draft.format, result, setRequest]);
  useEffect(() => () => setRequest(null), [setRequest]);

  const go = (next: number) => {
    setError(undefined);
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  const detour = (to: "login" | "signup") => {
    try {
      sessionStorage.setItem(storageKey(target.publicId), JSON.stringify({ sessionType: draft.sessionType, format: draft.format, note: draft.note }));
    } catch {}
    const back = encodeURIComponent(`/request/${target.href.split("/").pop()}?resume=1`);
    window.location.assign(to === "login" ? `/login?next=${back}` : `/signup/patient?next=${back}`);
  };

  const checkContact = () => {
    const next: Errors = {};
    if (!draft.name.trim()) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) next.email = "Enter a valid email so they can reach you.";
    if (draft.phone.trim() && !/^[+()\d\s.-]{7,40}$/.test(draft.phone.trim())) next.phone = "Enter a valid phone number, or leave it empty.";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = () =>
    startTransition(async () => {
      setError(undefined);
      // The server validates every field again.
      const res = await sendSessionRequest({ publicId: target.publicId, ...draft } as RequestInput);
      if (res.ok) {
        try {
          sessionStorage.removeItem(storageKey(target.publicId));
        } catch {}
        setResult(res);
        window.scrollTo({ top: 0 });
        return;
      }
      if (res.fieldErrors && (res.fieldErrors.name || res.fieldErrors.email || res.fieldErrors.phone)) {
        setErrors(res.fieldErrors);
        go(4);
      }
      setError(res.error ?? Object.values(res.fieldErrors ?? {})[0] ?? "Something went wrong. Please try again.");
    });

  if (result) return <Done target={target} patient={patient} result={result} />;

  if (!target.accepting) {
    return (
      <div className="flex flex-col gap-6">
        <AuthTitle title={`${target.first} isn't taking new clients right now`} description={`Save ${target.first}'s profile to check back later, or browse other verified providers who are accepting new clients.`} />
        <Button asChild fullWidth className="h-10 text-[14px]">
          <Link href="/providers">Back to search</Link>
        </Button>
      </div>
    );
  }

  const header = (
    <div className="flex flex-col gap-4">
      {step > 1 ? (
        <button type="button" onClick={() => go(step - 1)} className="-ml-1 inline-flex w-fit items-center gap-1.5 rounded-md px-1 py-0.5 type-ui-label text-warm-600 transition-colors hover:text-warm-900">
          <ArrowLeftIcon className="size-4" />
          Go back
        </button>
      ) : (
        <Link href={target.href} className="-ml-1 inline-flex w-fit items-center gap-1.5 rounded-md px-1 py-0.5 type-ui-label text-warm-600 transition-colors hover:text-warm-900">
          <ArrowLeftIcon className="size-4" />
          Go back
        </Link>
      )}
      <Dashes step={step} />
    </div>
  );
  const eyebrow = `Step ${step} of ${STEPS}`;
  const chosen = [sessionTypeLabel(draft.sessionType), formatLabel(draft.format)];

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) go(2);
        else if (step === 2) go(3);
        else if (step === 3) go(4);
        else if (step === 4) {
          if (patient) {
            if (checkContact()) go(5);
          } else if (choice === "login" || choice === "signup") detour(choice);
          else if (choice === "guest" && checkContact()) go(5);
        } else submit();
      }}
    >
      {header}

      {step === 1 && (
        <>
          <AuthTitle eyebrow={eyebrow} title="Confirm your request" description={`You selected ${target.name}`} />
          <ProviderCard target={target} />
          <Continue>Confirm</Continue>
        </>
      )}

      {step === 2 && (
        <>
          <AuthTitle eyebrow={eyebrow} title="Session details" description={`Two quick questions so ${target.first} knows how to prepare.`} />
          <ProviderCard target={target} />
          <div className="flex flex-col gap-2.5">
            <p id="session-type" className="type-ui-caption tracking-wide text-warm-500 uppercase">
              Session type
            </p>
            <ToggleGroup type="single" variant="chip" size="chip" spacing={2} aria-labelledby="session-type" value={draft.sessionType} onValueChange={(v) => v && update({ sessionType: v })} className="flex-wrap">
              {target.sessionTypes.map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {sessionTypeLabel(t)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2.5">
            <p id="session-format" className="type-ui-caption tracking-wide text-warm-500 uppercase">
              Format
            </p>
            <ToggleGroup type="single" variant="chip" size="chip" spacing={2} aria-labelledby="session-format" value={draft.format} onValueChange={(v) => v && update({ format: v })} className="flex-wrap">
              {target.formats.map((f) => (
                <ToggleGroupItem key={f} value={f}>
                  {f === "online" ? <MonitorIcon className="size-4" /> : <MapPinIcon className="size-4" />}
                  {formatLabel(f)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Continue disabled={!draft.sessionType || !draft.format} />
        </>
      )}

      {step === 3 && (
        <>
          <AuthTitle eyebrow={eyebrow} title={`A note to ${target.first}`} description="Anything you'd like to tell before your first session? This is completely optional." />
          <ProviderCard target={target}>
            <Pills items={chosen} />
          </ProviderCard>
          <AuthField
            id="request-note"
            label={<span className="tracking-wide uppercase">Message</span>}
            optional
            hint={`This goes directly to ${target.first}. It helps ${her} prepare but does not affect your request.`}
          >
            <Textarea
              id="request-note"
              value={draft.note}
              onChange={(e) => update({ note: e.target.value.slice(0, 1000) })}
              placeholder="Say what’s on your mind..."
              rows={5}
              className="min-h-[120px] resize-y shadow-none"
            />
          </AuthField>
          <div className="flex flex-col gap-2">
            <Continue />
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="h-10 text-[14px]"
              onClick={() => {
                update({ note: "" });
                go(4);
              }}
            >
              Skip for now
            </Button>
          </div>
          <CrisisStrip />
        </>
      )}

      {step === 4 && patient && (
        <>
          {/* TODO(client): copy for signed-in patients. */}
          <AuthTitle eyebrow={eyebrow} title="Almost there" description={`Check the details ${target.first} will use to reach you.`} />
          <ProviderCard target={target} />
          <ContactFields draft={draft} update={update} errors={errors} lockedEmail />
          <Continue />
        </>
      )}

      {step === 4 && !patient && (
        <>
          <AuthTitle eyebrow={eyebrow} title="Almost there" description="Save your request by logging in or creating a free account. Takes under a minute." />
          <ProviderCard target={target} />
          <div className="flex flex-col gap-3">
            <p id="continue-how" className="type-ui-label text-warm-800">
              How would you like to continue?
            </p>
            <RadioGroupPrimitive.Root value={choice ?? ""} onValueChange={(v) => setChoice(v as Choice)} aria-labelledby="continue-how" className="flex flex-col gap-2.5">
              {CHOICES.map((c) => (
                <RadioGroupPrimitive.Item
                  key={c.value}
                  value={c.value}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border bg-white p-3.5 text-left outline-none",
                    "transition-[border-color,box-shadow,background-color] duration-200 focus-visible:ring-4 focus-visible:ring-ring/15",
                    "data-[state=unchecked]:border-warm-200 data-[state=unchecked]:hover:border-warm-300 data-[state=unchecked]:hover:bg-warm-50/60",
                    "data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50/50 data-[state=checked]:shadow-[0_0_0_1px_var(--color-blue-600)]",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-warm-50 text-warm-700">
                    <c.Icon className="size-4" />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2 type-ui-heading text-warm-900">
                      {c.title}
                      {"tag" in c && <span className="rounded-md bg-warm-100 px-1.5 py-0.5 type-ui-caption font-medium text-warm-700">{c.tag}</span>}
                    </span>
                    <span className="type-ui-small text-warm-600">{c.body}</span>
                  </span>
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-warm-300 bg-white transition-colors group-data-[state=checked]:border-blue-600">
                    <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-blue-600" />
                  </span>
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroupPrimitive.Root>
          </div>
          {choice === "guest" && (
            <div className="flex animate-ui-enter flex-col gap-4">
              <ContactFields draft={draft} update={update} errors={errors} />
              <p className="type-ui-small text-warm-600">{target.first} will reach out soon</p>
            </div>
          )}
          <Continue disabled={!choice}>Confirm</Continue>
        </>
      )}

      {step === 5 && (
        <>
          <AuthTitle eyebrow={eyebrow} title="Review your request" description="Everything looks right? Hit confirm and you're done." />
          <ProviderCard target={target} />
          <Review
            rows={[
              ["Name", draft.name.trim()],
              ["Email", draft.email.trim()],
              ...(draft.phone.trim() ? ([["Phone number", draft.phone.trim()]] as [string, string][]) : []),
            ]}
          />
          <Review
            rows={[
              ["Session type", sessionTypeLabel(draft.sessionType)],
              ["Format", formatLabel(draft.format)],
              [`Note to ${target.first}`, draft.note.trim() ? "Included" : "Not included"],
            ]}
          />
          <FormAlert message={error} />
          <div className="flex flex-col gap-3">
            <Continue pending={pending}>Confirm request</Continue>
            <p className="text-center type-ui-caption text-warm-500">
              No payment required now.
              <br />
              Please contact provider for services cost.
            </p>
            {/* TODO(client): copy. */}
            <p className="text-center type-ui-caption text-warm-500">
              We&apos;ll share your name, contact details and note with {target.first}&apos;s office so they can reply.
            </p>
          </div>
        </>
      )}

      {step < 5 && error && <FormAlert message={error} />}

      {/* People never see this; bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={draft.website} onChange={(e) => update({ website: e.target.value })} />

      {step === 1 && (
        <p className="text-center type-ui-caption text-warm-500">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-warm-800">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-warm-800">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}

function ContactFields({ draft, update, errors, lockedEmail }: { draft: Draft; update: (p: Partial<Draft>) => void; errors: Errors; lockedEmail?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <AuthField id="request-name" label="Your name" error={errors.name}>
        <TextInput id="request-name" autoComplete="name" placeholder="Enter your full name" value={draft.name} onChange={(e) => update({ name: e.target.value })} error={errors.name} />
      </AuthField>
      <AuthField id="request-phone" label="Phone number" optional error={errors.phone}>
        <TextInput id="request-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="Enter phone number" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} error={errors.phone} />
      </AuthField>
      <AuthField id="request-email" label="Email" error={errors.email} hint={lockedEmail ? "Your account email." : undefined}>
        <TextInput
          id="request-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="m@example.com"
          value={draft.email}
          readOnly={lockedEmail}
          onChange={(e) => update({ email: e.target.value })}
          error={errors.email}
          className={cn(lockedEmail && "bg-warm-50 text-warm-600")}
        />
      </AuthField>
    </div>
  );
}
