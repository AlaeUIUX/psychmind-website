import { NextResponse, type NextRequest } from "next/server";
import { db, dbReady } from "@/db";
import { upload } from "@/db/schema";
import { UPLOAD_RULES, type UploadKind } from "@/lib/provider/uploads";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/server/auth/session";
import { putFile } from "@/server/storage";

// POST multipart { file, kind: "photo" | "license" } → { id, fileName, size, mimeType }.
// Providers only. Type and size are enforced here whatever the browser said,
// and the bytes are sniffed so a renamed file can't pass as a PDF/image.

const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // RIFF....WEBP
};

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (session.user.role !== "provider") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const limit = await rateLimit("upload", `${session.user.id}:${clientIp(request.headers)}`, 30, "1 h");
  if (!limit.ok) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") as UploadKind | null;
  if (!(file instanceof File) || !kind || !(kind in UPLOAD_RULES)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const rules = UPLOAD_RULES[kind];
  if (file.size > rules.maxBytes) {
    return NextResponse.json({ error: `That file is larger than ${rules.maxBytes / 1024 / 1024} MB.` }, { status: 413 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = (rules.types as readonly string[]).find((t) => SIGNATURES[t]?.(bytes));
  if (!type) return NextResponse.json({ error: "That file type isn't supported." }, { status: 415 });

  const id = crypto.randomUUID();
  const storageKey = `${session.user.id}/${kind}/${id}.${EXT[type]}`;
  try {
    await putFile(storageKey, bytes);
  } catch (err) {
    console.error("upload storage failed", err);
    return NextResponse.json({ error: "Uploads aren't available right now. Please try again later." }, { status: 503 });
  }

  await dbReady;
  const fileName = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || `${kind}.${EXT[type]}`;
  await db.insert(upload).values({ id, ownerId: session.user.id, kind, storageKey, fileName, mimeType: type, size: file.size });
  return NextResponse.json({ id, fileName, size: file.size, mimeType: type });
}
