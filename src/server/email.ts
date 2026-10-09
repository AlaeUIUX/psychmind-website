import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

// Transactional email. With RESEND_API_KEY set, mail goes out through Resend.
// Without it (local dev, tests) every message is written to a local outbox
// that /dev/mail displays, so sign-up, verification and reset links can be
// clicked without a mail provider (EMAIL_TRANSPORT=outbox forces this even
// with a key). Production without a key fails loudly.

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Replies go here (a session request: the patient). */
  replyTo?: string;
};
export type OutboxEntry = Email & { id: string; sentAt: string };

const OUTBOX = path.join(process.cwd(), ".data", "outbox.json");
const FROM = process.env.EMAIL_FROM || "PsychMind <onboarding@resend.dev>";
// One queue for the whole process: the dev server can load this module more
// than once (one copy per route bundle), and two copies writing the file at
// the same moment would drop an email.
const queue = globalThis as typeof globalThis & { __psychmindOutbox?: Promise<void> };

export async function readOutbox(): Promise<OutboxEntry[]> {
  try {
    return JSON.parse(await readFile(OUTBOX, "utf8")) as OutboxEntry[];
  } catch {
    return [];
  }
}

export async function sendEmail(email: Email) {
  const key = process.env.RESEND_API_KEY;
  // EMAIL_TRANSPORT=outbox forces the local outbox even when a key is set (dev/tests).
  if (key && process.env.EMAIL_TRANSPORT !== "outbox") {
    const { error } = await new Resend(key).emails.send({ from: FROM, ...email });
    if (error) throw new Error(`Email failed: ${error.message}`);
    return;
  }
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("RESEND_API_KEY is not set; cannot send email in production.");
  }
  // One write at a time: two emails sent together must not overwrite each other.
  const write = (queue.__psychmindOutbox ?? Promise.resolve()).then(async () => {
    const outbox = await readOutbox();
    outbox.unshift({ ...email, id: crypto.randomUUID(), sentAt: new Date().toISOString() });
    await mkdir(path.dirname(OUTBOX), { recursive: true });
    await writeFile(OUTBOX, JSON.stringify(outbox.slice(0, 200), null, 2));
  });
  queue.__psychmindOutbox = write.catch(() => {});
  await write;
  console.info(`[email:outbox] to=${email.to} subject="${email.subject}" — open /dev/mail`);
}
