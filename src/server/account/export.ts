import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { displayName } from "@/lib/provider/display";
import {
  account,
  accountRecoveryRequest,
  auditLog,
  blogSubscriber,
  emailPreference,
  notificationOptOut,
  providerLicense,
  providerLocation,
  providerProfile,
  savedProvider,
  session,
  sessionRequest,
  subscription,
  upload,
  user,
} from "@/db/schema";

// "Download my data": everything PsychMind stores about one person, as JSON.
// Secrets are never included: no password hash, sign-in tokens or
// two-step-login secret. File contents aren't bundled; each file is listed and
// can be opened from the profile.

export async function exportAccountData(userId: string) {
  await dbReady;
  const [me] = await db
    .select({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  const [signInMethods, sessions, files, subscriptions, profileRows] = await Promise.all([
    db.select({ method: account.providerId, createdAt: account.createdAt }).from(account).where(eq(account.userId, userId)),
    db
      .select({ createdAt: session.createdAt, expiresAt: session.expiresAt, ipAddress: session.ipAddress, userAgent: session.userAgent })
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(desc(session.createdAt)),
    db
      .select({ id: upload.id, kind: upload.kind, fileName: upload.fileName, mimeType: upload.mimeType, size: upload.size, createdAt: upload.createdAt })
      .from(upload)
      .where(eq(upload.ownerId, userId)),
    db
      .select({
        plan: subscription.plan,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      })
      .from(subscription)
      .where(eq(subscription.referenceId, userId)),
    db.select().from(providerProfile).where(eq(providerProfile.userId, userId)),
  ]);

  // As a patient: the session requests they sent and the providers they saved.
  const [sentRequests, saved] = await Promise.all([
    db
      .select({
        provider: providerProfile.publicId,
        providerFirstName: providerProfile.firstName,
        providerLastName: providerProfile.lastName,
        providerBusinessName: providerProfile.businessName,
        providerDisplayAsBusiness: providerProfile.displayAsBusiness,
        name: sessionRequest.name,
        email: sessionRequest.email,
        phone: sessionRequest.phone,
        sessionType: sessionRequest.sessionType,
        format: sessionRequest.format,
        note: sessionRequest.note,
        status: sessionRequest.status,
        sentAt: sessionRequest.createdAt,
      })
      .from(sessionRequest)
      .innerJoin(providerProfile, eq(providerProfile.id, sessionRequest.profileId))
      .where(eq(sessionRequest.patientId, userId))
      .orderBy(desc(sessionRequest.createdAt)),
    db
      .select({
        provider: providerProfile.publicId,
        providerFirstName: providerProfile.firstName,
        providerLastName: providerProfile.lastName,
        providerBusinessName: providerProfile.businessName,
        providerDisplayAsBusiness: providerProfile.displayAsBusiness,
        savedAt: savedProvider.createdAt,
      })
      .from(savedProvider)
      .innerJoin(providerProfile, eq(providerProfile.id, savedProvider.profileId))
      .where(eq(savedProvider.userId, userId)),
  ]);

  // Email choices, recovery requests and account events (the email address
  // is the key for the first two, so they follow the current address).
  const address = me?.email ?? "";
  const [optOuts, emailPrefs, blogSubscription, recoveryRequests, accountEvents] = await Promise.all([
    db.select({ kind: notificationOptOut.kind, since: notificationOptOut.createdAt }).from(notificationOptOut).where(eq(notificationOptOut.userId, userId)),
    db.select({ marketingOptOutAt: emailPreference.marketingOptOutAt, createdAt: emailPreference.createdAt }).from(emailPreference).where(eq(emailPreference.email, address)),
    db.select({ confirmedAt: blogSubscriber.confirmedAt, createdAt: blogSubscriber.createdAt }).from(blogSubscriber).where(eq(blogSubscriber.email, address)),
    db
      .select({
        contactEmail: accountRecoveryRequest.contactEmail,
        fullName: accountRecoveryRequest.fullName,
        details: accountRecoveryRequest.details,
        status: accountRecoveryRequest.status,
        idFileName: accountRecoveryRequest.idFileName,
        resolutionNote: accountRecoveryRequest.resolutionNote,
        createdAt: accountRecoveryRequest.createdAt,
        resolvedAt: accountRecoveryRequest.resolvedAt,
      })
      .from(accountRecoveryRequest)
      .where(eq(accountRecoveryRequest.userId, userId)),
    // Changes to the account itself (email, password, two-step login), not who on our team acted.
    db
      .select({ action: auditLog.action, at: auditLog.createdAt })
      .from(auditLog)
      .where(and(eq(auditLog.targetType, "user"), eq(auditLog.targetId, userId)))
      .orderBy(desc(auditLog.createdAt)),
  ]);
  const named = <T extends { providerFirstName: string; providerLastName: string; providerBusinessName: string | null; providerDisplayAsBusiness: boolean }>(
    { providerFirstName, providerLastName, providerBusinessName, providerDisplayAsBusiness, ...rest }: T,
  ) => ({
    providerName: displayName({ firstName: providerFirstName, lastName: providerLastName, businessName: providerBusinessName, displayAsBusiness: providerDisplayAsBusiness }),
    ...rest,
  });

  const profile = profileRows[0];
  const [locations, licenses, history] = profile
    ? await Promise.all([
        db.select().from(providerLocation).where(eq(providerLocation.profileId, profile.id)),
        db
          .select({
            state: providerLicense.state,
            licenseNumber: providerLicense.licenseNumber,
            issuingBody: providerLicense.issuingBody,
            status: providerLicense.status,
            expiresAt: providerLicense.expiresAt,
            documentId: providerLicense.documentId,
            createdAt: providerLicense.createdAt,
          })
          .from(providerLicense)
          .where(eq(providerLicense.profileId, profile.id)),
        // Decisions about their profile (not who on our team made them).
        db
          .select({ action: auditLog.action, meta: auditLog.meta, at: auditLog.createdAt })
          .from(auditLog)
          .where(and(eq(auditLog.targetType, "provider_profile"), eq(auditLog.targetId, profile.id)))
          .orderBy(desc(auditLog.createdAt)),
      ])
    : [[], [], []];

  return {
    exportedAt: new Date().toISOString(),
    about:
      "Everything PsychMind stores about your account. Passwords and security keys are never included. Files you uploaded are listed under 'files'.",
    account: me ?? null,
    signInMethods,
    sessions,
    files,
    subscriptions,
    sessionRequests: sentRequests.map(named),
    savedProviders: saved.map(named),
    emailChoices: { turnedOff: optOuts, newsAndTips: emailPrefs[0] ?? null, blogSubscription: blogSubscription[0] ?? null },
    accountRecoveryRequests: recoveryRequests,
    accountEvents,
    providerProfile: profile ? { ...profile, locations, licenses, reviewHistory: history } : null,
  };
}
