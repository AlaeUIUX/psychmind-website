import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createRecoveryRequest } from "@/server/account/recovery";
import { getSession } from "@/server/auth/session";
import { putFile } from "@/server/storage";

// POST multipart from /account-recovery ("Can't access your email?").
// Anyone can send one, so it's rate-limited per IP and per account email,
// has a honeypot, and answers the same whether or not an account matched.
// The photo ID is sniffed like other uploads and kept privately until the
// request is closed. A route handler (not a server action) so a 4 MB photo
// fits. TODO(client): copy.

const ID_TYPES = {
  "application/pdf": { ext: "pdf", sniff: (b: Uint8Array) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  "image/png": { ext: "png", sniff: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { ext: "jpg", sniff: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/webp": { ext: "webp", sniff: (b: Uint8Array) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
} as const;
const MAX_ID_BYTES = 4 * 1024 * 1024;

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const schema = z
  .object({
    accountEmail: email,
    contactEmail: email,
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    claimedRole: z.enum(["patient", "provider"], { error: "Choose one." }),
    licenseNumber: z.string().trim().max(60).optional(),
    details: z.string().trim().max(1000, "Keep it under 1,000 characters.").optional(),
  })
  .refine((v) => v.accountEmail !== v.contactEmail, { path: ["contactEmail"], message: "Use a different address from the one you can't access." });

const fail = (status: number, body: { error?: string; fieldErrors?: Record<string, string> }) => NextResponse.json(body, { status });

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, { error: "Something went wrong. Please try again." });
  // Bots fill every field; people never see this one.
  if (String(form.get("website") ?? "")) return NextResponse.json({ ok: true });

  const session = await getSession();
  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string" && v !== ""));
  // Signed in, the account is theirs: no need to type it.
  if (session) raw.accountEmail = session.user.email;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return fail(400, { fieldErrors });
  }
  const v = parsed.data;

  const ip = clientIp(request.headers);
  const byIp = await rateLimit("account-recovery-ip", ip, 3, "1 h");
  const byAccount = await rateLimit("account-recovery-account", v.accountEmail, 3, "1 d");
  if (!byIp.ok || !byAccount.ok) return fail(429, { error: "Too many requests. Please try again later." });

  const file = form.get("idDocument");
  const hasFile = file instanceof File && file.size > 0;
  if (v.claimedRole === "provider" && !hasFile) return fail(400, { fieldErrors: { idDocument: "Add a photo of your government ID." } });
  let idDocument = null;
  if (hasFile) {
    if (file.size > MAX_ID_BYTES) return fail(413, { fieldErrors: { idDocument: "That file is larger than 4 MB." } });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = (Object.keys(ID_TYPES) as (keyof typeof ID_TYPES)[]).find((t) => ID_TYPES[t].sniff(bytes));
    if (!type) return fail(415, { fieldErrors: { idDocument: "Use a JPG, PNG, WebP or PDF." } });
    const storageKey = `recovery/${crypto.randomUUID()}.${ID_TYPES[type].ext}`;
    try {
      await putFile(storageKey, bytes);
    } catch (err) {
      console.error("recovery ID storage failed", err);
      return fail(503, { error: "Uploads aren't available right now. Please try again later." });
    }
    idDocument = { storageKey, fileName: file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || `id.${ID_TYPES[type].ext}`, mimeType: type };
  }

  try {
    await createRecoveryRequest({
      accountEmail: v.accountEmail,
      contactEmail: v.contactEmail,
      fullName: v.fullName,
      claimedRole: v.claimedRole,
      licenseNumber: v.claimedRole === "provider" ? v.licenseNumber || null : null,
      details: v.details || null,
      signedIn: Boolean(session),
      idDocument,
    });
  } catch (err) {
    console.error("recovery request failed", err);
    return fail(500, { error: "We couldn't send your request. Please try again." });
  }
  return NextResponse.json({ ok: true });
}
