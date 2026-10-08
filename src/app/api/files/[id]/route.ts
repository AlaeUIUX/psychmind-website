import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, dbReady } from "@/db";
import { auditLog, providerProfile, upload } from "@/db/schema";
import { getSession } from "@/server/auth/session";
import { getFile } from "@/server/storage";

// Serves an uploaded file after checking who's asking:
// - license documents: the owner, or an admin (each admin view is audited);
// - profile photos: anyone once the provider is approved (photos are public
//   on the profile), otherwise the owner or an admin.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbReady;
  const [file] = await db.select().from(upload).where(eq(upload.id, id));
  if (!file) return new NextResponse("Not found", { status: 404 });

  const session = await getSession();
  const isOwner = session?.user.id === file.ownerId;
  const isAdmin = session?.user.role === "admin";

  let allowed = isOwner || isAdmin;
  if (!allowed && file.kind === "photo") {
    const [profile] = await db
      .select({ status: providerProfile.status })
      .from(providerProfile)
      .where(and(eq(providerProfile.userId, file.ownerId), eq(providerProfile.photoId, file.id)));
    allowed = profile?.status === "approved";
  }
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  if (file.kind === "license" && isAdmin && !isOwner) {
    await db.insert(auditLog).values({
      actorId: session!.user.id,
      action: "license_document.viewed",
      targetType: "upload",
      targetId: file.id,
    });
  }

  try {
    const bytes = await getFile(file.storageKey);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.fileName.replace(/"/g, "")}"`,
        "Cache-Control": file.kind === "photo" ? "private, max-age=300" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
