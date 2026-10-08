import "server-only";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { providerProfile, user as userTable } from "@/db/schema";
import { BASE_PLAN, stripeConfigured } from "@/lib/billing";
import { defaultOrigin } from "@/lib/hosts";
import { rateLimit } from "@/lib/rate-limit";
import { afterAccountDeleted, beforeAccountDeleted } from "@/server/account/cleanup";
import { sendEmail } from "@/server/email";
import { resetPasswordEmail, verifyEmail } from "@/server/emails";
import { onSubscriptionChange } from "@/server/billing/sync";

// Authentication for PsychMind (Better Auth, sessions in our own Postgres).
// - Email + password with required email verification (Figma sign-up and
//   reset flows), reset links valid for 30 minutes (Figma A5).
// - Google sign-in once GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set.
// - Two-step login (authenticator app + backup codes). Required for admins:
//   requireRole sends an admin without it to /two-factor/setup.
// - Account deletion (password required when the account has one).
// - Stripe subscriptions once STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET /
//   STRIPE_PRICE_BASE are set; without them the plugin isn't loaded and the
//   billing page explains payments aren't connected yet.
// `role` can never be set by the client: sign-up actions set it server-side.

/** Accounts that become admins (comma-separated, e.g. the owner's email).
 *  Admin pages still require the email to be verified, so listing an address
 *  doesn't let a stranger claim it. */
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
const isAdminEmail = (email: string) => adminEmails.has(email.toLowerCase());

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

function stripePlugins() {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) return [];
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return [
    stripePlugin({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: false,
      subscription: {
        enabled: true,
        requireEmailVerification: true,
        plans: [{ name: BASE_PLAN.name, priceId: process.env.STRIPE_PRICE_BASE! }],
        // Only for themselves (the hooks.before guard below also requires a verified provider).
        authorizeReference: async ({ user, referenceId }) =>
          (user as { role?: string }).role === "provider" && referenceId === user.id,
        onSubscriptionComplete: async ({ subscription }) => onSubscriptionChange(subscription),
        onSubscriptionUpdate: async ({ subscription }) => onSubscriptionChange(subscription),
        onSubscriptionCancel: async ({ subscription }) => onSubscriptionChange(subscription),
        onSubscriptionCreated: async ({ subscription }) => onSubscriptionChange(subscription),
        onSubscriptionDeleted: async ({ subscription }) => onSubscriptionChange(subscription),
      },
    }),
  ];
}

export const auth = betterAuth({
  appName: "PsychMind",
  // Production: BETTER_AUTH_URL (https://app.psychmind.org). Locally: the app
  // host on whatever port the dev server got (PORT). Vercel previews: the
  // branch URL. Email links and the Google redirect URI are built from it.
  baseURL: process.env.BETTER_AUTH_URL || defaultOrigin(),
  // Locally the dev server may run on any port; production uses BETTER_AUTH_URL.
  trustedOrigins: process.env.NODE_ENV === "development" ? ["http://localhost:*", "http://*.localhost:*", "http://127.0.0.1:*"] : [],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8, // Figma: "Must be at least 8 characters long."
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 30, // Figma A5: "Expires in 30 min"
    revokeSessionsOnPasswordReset: true,
    // Sent after the response (so response time doesn't reveal whether an account exists).
    sendResetPassword: async ({ user, url }) => {
      after(() => sendEmail(resetPasswordEmail(user.email, url)).catch((err) => console.error("reset email failed", err)));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      after(() => sendEmail(verifyEmail(user.email, url)).catch((err) => console.error("verification email failed", err)));
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          // Google gives first/last name; keep them for the profile.
          mapProfileToUser: (profile) => ({ firstName: profile.given_name, lastName: profile.family_name }),
        },
      }
    : {},
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => beforeAccountDeleted(user.id),
      afterDelete: async (user) => afterAccountDeleted(user.id, (user as { role?: string }).role),
    },
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "patient", input: false },
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => ({
          data: { ...newUser, role: isAdminEmail(newUser.email) ? "admin" : "patient" },
        }),
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          const [owner] = await db
            .select({ role: userTable.role, email: userTable.email, emailVerified: userTable.emailVerified })
            .from(userTable)
            .where(eq(userTable.id, session.userId));
          if (!owner) return;
          const listed = isAdminEmail(owner.email);
          // Two-step login only guards password sign-in, so admins can't use
          // Google: their sign-in must always pass the authenticator check.
          if (ctx?.path.includes("/callback") && (owner.role === "admin" || listed)) {
            throw new APIError("FORBIDDEN", { message: "Admins sign in with their email, password and authenticator code." });
          }
          // ADMIN_EMAILS is the source of truth, checked at every sign-in: a
          // listed (verified) account becomes admin even if it signed up
          // before being listed, and an admin taken off the list loses it.
          if (listed && owner.emailVerified && owner.role !== "admin") {
            await db.update(userTable).set({ role: "admin" }).where(eq(userTable.id, session.userId));
          } else if (!listed && owner.role === "admin") {
            await db.update(userTable).set({ role: "patient" }).where(eq(userTable.id, session.userId));
          }
        },
      },
    },
  },
  hooks: {
    // authorizeReference doesn't run for a user's own subscription, so who
    // may subscribe is enforced here: verified providers only.
    before: createAuthMiddleware(async (ctx) => {
      // Per-account limit on password guesses, whatever IP they come from
      // (the IP-based limits are in rateLimit below and in the actions).
      if (ctx.path === "/sign-in/email") {
        const email = String((ctx.body as { email?: unknown } | undefined)?.email ?? "").toLowerCase();
        if (email && !(await rateLimit("auth-signin-account", email, 10, "15 m")).ok) {
          throw new APIError("TOO_MANY_REQUESTS", { message: "Too many attempts. Please wait a few minutes and try again." });
        }
        return;
      }
      // Deleting an account that has a password always needs that password,
      // not just a recent session.
      if (ctx.path === "/delete-user") {
        const session = await getSessionFromCtx(ctx);
        const password = (ctx.body as { password?: unknown } | undefined)?.password;
        if (session && !password) {
          const methods = await ctx.context.internalAdapter.findAccounts(session.user.id);
          if (methods.some((a) => a.providerId === "credential")) {
            throw new APIError("BAD_REQUEST", { message: "Enter your password to delete your account." });
          }
        }
        return;
      }
      if (ctx.path !== "/subscription/upgrade" && ctx.path !== "/subscription/billing-portal") return;
      const session = await getSessionFromCtx(ctx);
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (!session || role !== "provider") throw new APIError("FORBIDDEN", { message: "Only providers can subscribe." });
      if (ctx.path === "/subscription/upgrade") {
        const [profile] = await db
          .select({ status: providerProfile.status })
          .from(providerProfile)
          .where(eq(providerProfile.userId, session.user.id));
        if (profile?.status !== "approved") {
          throw new APIError("FORBIDDEN", { message: "You can activate your listing once your profile is verified." });
        }
      }
    }),
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    // No cookie cache: roles can change (patient → provider, admin decisions)
    // and must take effect on the next request.
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 5 },
      "/request-password-reset": { window: 60 * 10, max: 3 },
      "/send-verification-email": { window: 60 * 10, max: 3 },
      "/delete-user": { window: 60 * 10, max: 5 },
    },
    // Shared across serverless instances (Upstash in production; see
    // lib/rate-limit.ts), checked and counted in one step.
    customStorage: {
      consume: async (key, rule) => {
        const result = await rateLimit("better-auth", key, rule.max, `${rule.window} s`);
        return { allowed: result.ok, retryAfter: result.ok ? null : result.retryAfterSeconds };
      },
    },
  },
  advanced: { cookiePrefix: "psychmind" },
  plugins: [
    ...stripePlugins(),
    twoFactor({
      issuer: "PsychMind",
      // Codes are checked within 10 minutes of the password step.
      twoFactorCookieMaxAge: 60 * 10,
    }),
    nextCookies(), // must stay last
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
