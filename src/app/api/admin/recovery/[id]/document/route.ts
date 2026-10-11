import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, dbReady } from "@/db";
import { accountRecoveryRequest, auditLog } from "@/db/schema";
import { getSession, hasTwoFactor, mustChangePassword } from "@/server/auth/session";
import { getFile } from "@/server/storage";

// The photo ID sent with an account recovery request. Admins only (with
// two-step login done, as for license documents), and every view is audited.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const user = session?.user;
  if (!user || user.role !== "admin" || !hasTwoFactor(user) || mustChangePassword(user)) return new NextResponse("Not found", { status: 404 });

  await dbReady;
  const [request] = await db
    .select({ key: accountRecoveryRequest.idStorageKey, fileName: accountRecoveryRequest.idFileName, mimeType: accountRecoveryRequest.idMimeType })
    .from(accountRecoveryRequest)
    .where(eq(accountRecoveryRequest.id, id));
  if (!request?.key || !request.mimeType) return new NextResponse("Not found", { status: 404 });

  await db.insert(auditLog).values({ actorId: user.id, action: "recovery_document.viewed", targetType: "account_recovery_request", targetId: id });
  try {
    const bytes = await getFile(request.key);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": request.mimeType,
        "Content-Disposition": `inline; filename="${(request.fileName ?? "id").replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
