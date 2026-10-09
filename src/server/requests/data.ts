import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { providerProfile, sessionRequest, user } from "@/db/schema";
import { displayName, shortName } from "@/lib/provider/display";
import { profilePath } from "@/lib/provider/links";
import { fileUrl } from "@/lib/provider/state";
import { requireRole } from "@/server/auth/session";
import { getDirectoryProvider } from "@/server/directory/data";

// Session requests: who a request can go to, and the lists patients and
// providers see. Each function scopes itself to its caller.

/** A listed provider, as the request wizard needs them. */
export async function requestTarget(publicId: string) {
  const p = await getDirectoryProvider(publicId);
  if (!p) return null;
  return {
    publicId: p.publicId,
    href: p.href,
    name: displayName(p),
    first: shortName(p),
    title: p.titleCredentials ?? "",
    pronouns: p.pronouns ?? null,
    photoUrl: p.photoUrl ?? null,
    bannerStyle: p.bannerStyle ?? null,
    isSample: !!p.isSample,
    accepting: p.acceptingNewClients !== false,
    // Figma B2 offers the provider's own session types and formats.
    sessionTypes: (p.sessionParticipants ?? []).filter(Boolean),
    formats: Array.from(new Set((p.locations ?? []).flatMap((l) => l.formats))),
  };
}
export type RequestTarget = NonNullable<Awaited<ReturnType<typeof requestTarget>>>;

/** Where a provider's requests are emailed, and their profile id (server only). */
export async function requestRecipient(publicId: string) {
  await dbReady;
  const [row] = await db
    .select({ profileId: providerProfile.id, requestEmail: providerProfile.requestEmail, accountEmail: user.email })
    .from(providerProfile)
    .innerJoin(user, eq(user.id, providerProfile.userId))
    .where(eq(providerProfile.publicId, publicId));
  return row ? { profileId: row.profileId, email: row.requestEmail || row.accountEmail } : null;
}

/** A request from this email to this provider in the last day, if any. */
export async function recentRequest(profileId: string, email: string) {
  await dbReady;
  const [row] = await db
    .select({ id: sessionRequest.id, createdAt: sessionRequest.createdAt })
    .from(sessionRequest)
    .where(
      and(
        eq(sessionRequest.profileId, profileId),
        eq(sql`lower(${sessionRequest.email})`, email.toLowerCase()),
        gt(sessionRequest.createdAt, sql`now() - interval '1 day'`),
      ),
    )
    .limit(1);
  return row ?? null;
}

type ProfileRow = typeof providerProfile.$inferSelect;
const named = (p: ProfileRow) => ({ firstName: p.firstName, lastName: p.lastName, businessName: p.businessName, displayAsBusiness: p.displayAsBusiness });

/** The signed-in patient's own requests ("My requests"), newest first. */
export async function myRequests() {
  const { user: patient } = await requireRole("patient", "/account");
  const patientId = patient.id;
  await dbReady;
  const rows = await db
    .select({ request: sessionRequest, profile: providerProfile })
    .from(sessionRequest)
    .innerJoin(providerProfile, eq(providerProfile.id, sessionRequest.profileId))
    .where(eq(sessionRequest.patientId, patientId))
    .orderBy(desc(sessionRequest.createdAt));
  return rows.map(({ request: r, profile: p }) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    sessionType: r.sessionType,
    format: r.format,
    hasNote: !!r.note,
    isDemo: r.isDemo,
    provider: {
      name: displayName(named(p)),
      first: shortName(named(p)),
      title: p.titleCredentials,
      photoUrl: p.externalPhotoUrl ?? (p.photoId ? fileUrl(p.photoId) : null),
      href: profilePath({ ...p, businessName: p.businessName }),
    },
  }));
}
export type MyRequest = Awaited<ReturnType<typeof myRequests>>[number];

/** Every request sent to the signed-in provider, newest first. */
export async function providerRequests() {
  const { user: provider } = await requireRole("provider", "/provider/requests");
  const providerUserId = provider.id;
  await dbReady;
  const rows = await db
    .select({ request: sessionRequest })
    .from(sessionRequest)
    .innerJoin(providerProfile, eq(providerProfile.id, sessionRequest.profileId))
    .where(eq(providerProfile.userId, providerUserId))
    .orderBy(desc(sessionRequest.createdAt));
  return rows.map(({ request: r }) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    contactedAt: r.contactedAt,
    name: r.name,
    email: r.email,
    phone: r.phone,
    sessionType: r.sessionType,
    format: r.format,
    note: r.note,
    fromAccount: !!r.patientId,
  }));
}
export type ProviderRequest = Awaited<ReturnType<typeof providerRequests>>[number];
