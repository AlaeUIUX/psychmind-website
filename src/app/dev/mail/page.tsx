import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readOutbox } from "@/server/email";

export const metadata: Metadata = { title: "Dev mailbox — PsychMind", robots: { index: false } };
export const dynamic = "force-dynamic";

// Local stand-in for an inbox: every email the app "sent" while
// RESEND_API_KEY is unset, newest first, with its links clickable.
// Never available in production.
export default async function DevMailPage() {
  const outboxMode = !process.env.RESEND_API_KEY || process.env.EMAIL_TRANSPORT === "outbox";
  if (process.env.VERCEL_ENV === "production" || !outboxMode) notFound();
  const outbox = await readOutbox();

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="type-h3 text-text-primary">Dev mailbox</h1>
        <p className="type-body text-text-tertiary">
          Emails sent locally (no RESEND_API_KEY). {outbox.length} message{outbox.length === 1 ? "" : "s"}.
        </p>
      </header>
      {outbox.length === 0 && <p className="type-body text-text-placeholder">Nothing yet.</p>}
      <ol className="flex flex-col gap-4">
        {outbox.map((mail) => (
          <li key={mail.id} className="flex flex-col gap-3 rounded-card border border-warm-200 bg-white p-5" data-testid="dev-mail">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="type-small font-semibold text-text-primary">{mail.subject}</p>
              <time className="type-caption text-text-placeholder">{new Date(mail.sentAt).toLocaleString()}</time>
            </div>
            <p className="type-small text-text-tertiary">To: <span data-testid="dev-mail-to">{mail.to}</span></p>
            <iframe
              title={mail.subject}
              srcDoc={mail.html}
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              className="h-[420px] w-full rounded-field border border-warm-200"
            />
            <ul className="flex flex-col gap-1">
              {Array.from(mail.text.matchAll(/https?:\/\/\S+/g)).map(([url]) => (
                <li key={url}>
                  <a href={url} className="break-all type-caption text-brand-primary underline" data-testid="dev-mail-link">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </main>
  );
}
