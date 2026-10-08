# Better Auth 1.7 + Stripe + Drizzle 0.45 + PGlite 0.5 on Next.js 16: cheat sheet

Researched 2026-10-08 against better-auth **1.7.7**, @better-auth/stripe **1.7.7**, drizzle-orm **0.45.3**, drizzle-kit **0.31.11**, @electric-sql/pglite **0.5.8**, Next **16.2.12** (installed) / 16.4 docs.

Legend: **[V]** verified in official docs or in the published package source/types (unpkg). **[U]** inferred or unverified; test it.

---

## 0. Versions, install, env

```bash
npm i better-auth@1.7.7 @better-auth/stripe@1.7.7 stripe@^22.6.2 drizzle-orm@0.45.3 postgres @electric-sql/pglite@0.5.8
npm i -D drizzle-kit@0.31.11
```

- **Do not use stripe 23.x yet.** @better-auth/stripe 1.7.7 declares `peerDependencies.stripe: "^18 || ^19 || ^20 || ^21 || ^22"`, so npm fails with ERESOLVE [V]. stripe 23.0.0 shipped 2026-09-30, pins API `2026-09-30.endive`, drops Node 18 and removes `Stripe.constructEventWithoutVerification` [V]. The newest 22.x is 22.6.2, and 22.6.0 pins `2026-08-26.dahlia` [V].
- better-auth 1.7.7 peer ranges: `drizzle-orm ^0.45.2 || >=1.0.0-rc.1`, `drizzle-kit >=0.31.4`, `next ^14 || ^15 || ^16` [V].
- better-auth 1.7.7 depends on `@better-auth/drizzle-adapter@1.7.7`. `better-auth/adapters/drizzle` is a pure `export *` re-export of it. The docs now tell you to install `@better-auth/drizzle-adapter` separately, but either import works [V].
- PGlite 0.5.0 upgraded to **Postgres 18.3** [V]. Don't reuse a data dir created by 0.3/0.4 [U].

| Env var | Notes |
|---|---|
| `BETTER_AUTH_SECRET` (fallback `AUTH_SECRET`) | Read automatically. **Throws in production if unset**; dev uses a built-in default [V]. Generate with `npx auth@1.7.7 secret` or `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Read automatically as `baseURL`. If unset, inferred from the request ("not recommended") [V]. `baseURL` can also be `{ allowedHosts: ["psychmind.org","*.vercel.app"], protocol: "https", fallback }` for previews [V]. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google` [V] |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | The plugin requires both [V] |
| `DATABASE_URL` | Unset means PGlite (dev only) |

---

## 1. `betterAuth({...})` server config

```ts
// src/server/auth/index.ts  (no `import "server-only"` if you want `npx auth generate` to load it, see 6)
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";       // or "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const stripeEnabled = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

export const auth = betterAuth({
  appName: "PsychMind",
  // baseURL <- BETTER_AUTH_URL, secret <- BETTER_AUTH_SECRET (implicit)
  database: drizzleAdapter(db, {
    provider: "pg",          // "pg" | "mysql" | "sqlite"
    schema,                  // keys MUST be model names: user, session, account, verification, subscription, rateLimit
    // usePlural: false      // true only if your schema keys are users/sessions/...
    // transaction: false    // default false
  }),
  trustedOrigins: ["https://psychmind.org", "https://*.vercel.app"], // baseURL origin is always trusted [V]
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,       // sign-in -> 403 EMAIL_NOT_VERIFIED until verified
    minPasswordLength: 8,                 // default 8
    maxPasswordLength: 128,               // default 128
    resetPasswordTokenExpiresIn: 60 * 30, // seconds, default 3600
    revokeSessionsOnPasswordReset: true,  // default false
    // autoSignIn: true (default). false -> no session on sign-up
    sendResetPassword: async ({ user, url, token }, request) => {
      after(() => sendResetEmail(user.email, url)); // docs: don't await the send (timing attacks)
    },
  },
  emailVerification: {
    sendOnSignUp: true,                // undefined -> follows requireEmailVerification
    sendOnSignIn: false,               // true -> re-sends on every blocked sign-in, then still throws 403
    autoSignInAfterVerification: true, // session cookie set when the link is clicked
    expiresIn: 60 * 60,                // seconds, default 3600
    sendVerificationEmail: async ({ user, url, token }, request) => {
      after(() => sendVerifyEmail(user.email, url));
    },
    // beforeEmailVerification(user, request) / afterEmailVerification(user, request) also exist
  },
  // Conditional Google: spread, or keep the key and set `enabled` (it exists on every provider entry) [V]
  socialProviders: googleEnabled
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, prompt: "select_account" } }
    : {},
  user: {
    additionalFields: {
      // type can be "string" | "number" | "boolean" | "date" | "json" | "string[]" | "number[]" | ["literal", ...]
      role: { type: ["patient", "provider", "admin"], required: false, input: false, defaultValue: "patient" },
    },
    changeEmail: {
      enabled: true,
      // sends to the CURRENT address when it's verified; then verifies the new one
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }, request) => { /* ... */ },
      // updateEmailWithoutVerification: false (only applies when the current email is unverified)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // default 7d
    updateAge: 60 * 60 * 24,     // default 1d
    cookieCache: { enabled: true, maxAge: 5 * 60, strategy: "compact" }, // strategy: "compact"(default) | "jwt" | "jwe"
  },
  rateLimit: {
    enabled: true,          // default: on in production only
    storage: "database",    // "memory"(default) | "database" (needs rateLimit table) | "secondary-storage"
    window: 60, max: 100,   // defaults 10s / 100
    customRules: {
      "/sign-in/email": { window: 60, max: 5 }, // built-in default: 3 per 10s
      "/sign-up/email": { window: 600, max: 5 },
      "/get-session": false,
    },
  },
  advanced: { cookiePrefix: "psychmind" }, // must match getSessionCookie() in proxy.ts
  databaseHooks: {
    user: {
      create: {
        // (user, ctx: GenericEndpointContext | null) => boolean | void | { data }
        before: async (user, ctx) => ({ data: { ...user, role: "patient" } }), // belt-and-braces; elevate later server-side
        // after: async (user, ctx) => {}
      },
    },
  },
  hooks: {
    // authorizeReference does NOT run for a user's own subscription, so gate "who may subscribe" here (see 7)
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/subscription/upgrade") return;
      const s = await getSessionFromCtx(ctx);                         // [U] exact signature
      if ((s?.user as { role?: string } | undefined)?.role !== "provider")
        throw new APIError("FORBIDDEN", { message: "Only providers can subscribe." });
    }),
  },
  plugins: [
    ...(stripeEnabled ? [stripe(stripeOptions())] : []), // see 7
    nextCookies(), // MUST be last [V]
  ],
});

export type Session = typeof auth.$Infer.Session; // { session, user } (user includes role)
```

**Role at sign-up, securely [V, from `parseInputData`]:**
- With `input: false` and a `defaultValue`, a client-sent `role` is **silently replaced** by the default on create. This also applies to server-side `auth.api.signUpEmail({ body: { role } })`.
- With `input: false` and no default, a truthy `role` throws 400 `FIELD_NOT_ALLOWED`. `updateUser` rejects it the same way.
- `input: false` also blocks OAuth `mapProfileToUser` from setting the field.
- **So you can't set `role` through Better Auth endpoints.** Elevate it server-side after sign-up with `db.update(user).set({ role: "provider" }).where(eq(user.id, res.user.id))`.
- With `requireEmailVerification`, a duplicate email returns a **synthetic** user id, so that update hits 0 rows. That's safe.
- `defaultValue` is applied in JS only. Give the column its own DB default [V].

**Other notes:**
- `additionalFields` default to `required: true`, `returned: true`, `input: true` [V].
- `advanced.database.validateSchema` defaults to **true**: Better Auth diffs your Drizzle schema object against what it writes, and **auth requests fail** with `SchemaMismatchError` (`code: "SCHEMA_MISMATCH"`) on a missing table or column, or on an extra NOT NULL column with no default. It doesn't compare types, nullability or index names [V].
- Rate limits **don't apply to server-side `auth.api.*` calls**: "only client-initiated requests are limited" [V]. Server actions need your own `rateLimit()`.
- `"memory"` storage is per-instance and useless on serverless [V]. `"secondary-storage"` needs a `secondaryStorage` (e.g. Upstash). That also moves **sessions** out of the DB unless `session.storeSessionInDatabase: true` [V].
- With cookie cache on, role or ban changes lag by up to `maxAge`. For sensitive checks call `getSession({ headers, query: { disableCookieCache: true } })` [V].
- RSCs can't set cookies, so session and cookie-cache refreshes only happen via server actions or route handlers [V].
- `after()` inside Better Auth callbacks [U]. The callbacks run inside the route handler or server action request scope, so it should work. The Better Auth JSDoc suggests `advanced.backgroundTasks: { handler: (p) => waitUntil(p) }` with `@vercel/functions` for its own deferred work [V].

---

## 2. Route handler

```ts
// src/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

export const { GET, POST } = toNextJsHandler(auth); // also returns PATCH, PUT, DELETE; accepts auth or auth.handler [V]
```

- The default `basePath` is `/api/auth`. The Stripe webhook is served here too, at `/api/auth/stripe/webhook`.
- A sibling `src/app/api/auth/route.ts` only serves the bare `/api/auth` path, so it doesn't clash with `[...all]`, which needs at least one segment.

---

## 3. Server side: session, server actions, errors

```ts
// RSC / server action / route handler
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() }); // null if signed out
// fresh DB read: auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
```

```ts
"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError, isAPIError } from "better-auth/api";
import { auth } from "@/server/auth";

export async function signUpAction(fd: FormData) {
  const h = await headers();
  const res = await auth.api.signUpEmail({
    body: { name, email, password, callbackURL: "/account" }, // + rememberMe?, image?, additional input:true fields
    headers: h,
  });
  // requireEmailVerification -> res.token === null (no session); duplicate email -> SAME shape, synthetic user
}

export async function signInAction(fd: FormData) {
  try {
    await auth.api.signInEmail({ body: { email, password, rememberMe: true }, headers: await headers() });
    // nextCookies() writes Set-Cookie into next/headers cookies automatically
  } catch (e) {
    if (e instanceof APIError) {                    // or isAPIError(e)
      const code = e.body?.code;                    // "INVALID_EMAIL_OR_PASSWORD" | "EMAIL_NOT_VERIFIED" | ...
      // e.status = "UNAUTHORIZED" | "FORBIDDEN" | ... (name or number), e.statusCode = 401/403, e.body?.message
      return { error: code };
    }
    throw e;
  }
  redirect("/account"); // keep redirect() OUTSIDE try/catch (it throws NEXT_REDIRECT)
}

await auth.api.signOut({ headers: await headers() });
await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" }, headers: await headers() });
await auth.api.resetPassword({ body: { newPassword, token } });               // token may also come as ?token=
await auth.api.sendVerificationEmail({ body: { email, callbackURL: "/account" }, headers: await headers() });
await auth.api.changePassword({ body: { currentPassword, newPassword, revokeOtherSessions: true }, headers: await headers() });
await auth.api.changeEmail({ body: { newEmail, callbackURL: "/account" }, headers: await headers() });
// optional on any call: returnHeaders: true -> { headers, response }; asResponse: true -> Response
```

**Behaviour per endpoint (from the 1.7.7 route source) [V]:**

| Call | Path | Notes |
|---|---|---|
| `signUpEmail` | POST `/sign-up/email` | Duplicate email: **422 `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`**, but only when `requireEmailVerification` is off and `autoSignIn !== false`. Otherwise you get a generic `{ token: null, user: synthetic }` and `onExistingUserSignUp` fires. Plain `USER_ALREADY_EXISTS` is **not** thrown here. Verification email goes out if `sendOnSignUp ?? requireEmailVerification` (an explicit `false` disables it). |
| `signInEmail` | POST `/sign-in/email` | Bad credentials: `UNAUTHORIZED` + `INVALID_EMAIL_OR_PASSWORD`. Unverified: `FORBIDDEN` + `EMAIL_NOT_VERIFIED` (re-sends first if `sendOnSignIn`). Returns `{ redirect, token, url, user }`. |
| `requestPasswordReset` | POST `/request-password-reset` | **This is the 1.7 name. `forgetPassword` doesn't exist in 1.7.7.** Same response for unknown emails. Throws `RESET_PASSWORD_DISABLED` if `sendResetPassword` is missing. The email `url` is `{baseURL}/reset-password/{token}?callbackURL={redirectTo}`, and that GET redirects to `redirectTo?token=...` or `?error=INVALID_TOKEN`. |
| `resetPassword` | POST `/reset-password` | Body `{ newPassword, token }`. Calls `onPasswordReset` and revokes sessions if configured. |
| `sendVerificationEmail` | POST `/send-verification-email` | Works with or without a session. Signed out: always `{ status: true }`, padded to at least 500 ms. Signed in: `EMAIL_MISMATCH` / `EMAIL_ALREADY_VERIFIED`. Throws `VERIFICATION_EMAIL_NOT_ENABLED` if no sender. |
| `verifyEmail` (link) | GET `/verify-email?token&callbackURL` | Success: redirects to `callbackURL` (default `/`), with a cookie if `autoSignInAfterVerification`. Error: `callbackURL?error=<code>` (TOKEN_EXPIRED / INVALID_TOKEN / USER_NOT_FOUND; the docs show lowercase `invalid_token`, so the literal casing is [U]). With no `callbackURL`: JSON, or a 401 `APIError`. |
| `changePassword` | POST `/change-password` | Needs a session. With `revokeOtherSessions`, a new session token is issued and nextCookies sets it. |
| `changeEmail` | POST `/change-email` | `CHANGE_EMAIL_DISABLED` unless enabled. An existing target email gives a silent `{ status: true }`. |

Other `BASE_ERROR_CODES` you'll see [V]: `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `SESSION_EXPIRED`, `INVALID_PASSWORD`, `CREDENTIAL_ACCOUNT_NOT_FOUND`, `INVALID_CALLBACK_URL`, `INVALID_ORIGIN`, `FIELD_NOT_ALLOWED`, `CROSS_SITE_NAVIGATION_LOGIN_BLOCKED`.

---

## 4. Client

```ts
// src/lib/auth/client.ts
"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import type { auth } from "@/server/auth";         // type-only import: erased, safe with server-only

export const authClient = createAuthClient({       // baseURL optional when same origin
  plugins: [
    inferAdditionalFields<typeof auth>(),          // or inferAdditionalFields({ user: { role: { type: "string" } } })
    stripeClient({ subscription: true }),
  ],
});

await authClient.signIn.social({
  provider: "google",
  callbackURL: "/account",              // after success
  errorCallbackURL: "/login?error=oauth",
  newUserCallbackURL: "/welcome",       // first sign-in only
  // disableRedirect: true -> returns { url, redirect:false } instead of navigating
});
const { data, error } = await authClient.signIn.email({ email, password }); // error.status / error.message
const { data: session, isPending } = authClient.useSession();
```

- Callback URLs must be relative (a single leading `/`) or match `trustedOrigins` [V].
- Google issues a refresh token only on first consent. Use `accessType: "offline", prompt: "select_account consent"` if you need one [V].

---

## 5. `proxy.ts` (Next 16): optimistic cookie check

```ts
// src/proxy.ts  (same level as app/; Node.js runtime by default; `runtime` config is NOT allowed here) [V]
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {           // named `proxy` or default export
  // (request: Request | Headers, { cookiePrefix?, cookieName?, path? }) => string | null   [V]
  if (!getSessionCookie(request, { cookiePrefix: "psychmind" })) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/provider/:path*", "/admin/:path*"] };
```

- `getSessionCookie` doesn't read your auth config. If you set `advanced.cookiePrefix`, pass the same prefix [V].
- It checks `<prefix>.session_token` and `__Secure-<prefix>.session_token` for **existence only** [V].
- `getCookieCache(request, { secret?, strategy?, cookiePrefix? })` decodes the cookie cache (needs `BETTER_AUTH_SECRET`) [V].
- Don't import `@/server/auth` into proxy.ts unless you accept the DB and PGlite in the proxy bundle.
- A matcher that skips a path also skips server actions posted to that path. Always re-check auth inside each action [V, Next docs].

---

## 6. Schema: CLI and hand-written Drizzle tables

**CLI** (the package is now `auth`; bins `auth` / `better-auth`; replaces `@better-auth/cli`) [V]:

```bash
npx auth@1.7.7 generate --config src/server/auth/index.ts --output src/db/schema/auth.generated.ts --yes
# offline: add --adapter drizzle --dialect postgresql   (still loads your config for plugins/fields)
# `npx auth migrate` works ONLY with the built-in Kysely adapter; with Drizzle use drizzle-kit.
```

CLI gotchas:
- The CLI refuses to load a config with `import "server-only"`. It tells you to remove the import "temporarily" [V].
- It evaluates your config, so your `db` module runs. With PGlite that **opens the data dir**: stop `next dev` first.
- It resolves tsconfig `paths` [V].
- Default output is `./auth-schema.ts` [V].
- Columns come out **snake_case**, table names snake_case (`rateLimit` -> `rate_limit`), property keys camelCase [V].
- It emits Drizzle **v1** `relations()` [V].
- The `@better-auth/drizzle-adapter/relations-v2` path emits `defineRelationsPart`, which is a drizzle **1.0 RC** API and doesn't exist on 0.45 [V/U].
- Relations are only needed for `advanced.database.joins: true` [V].

**How the adapter maps names:** it looks up `schema[modelName][fieldName]`, where the export key is the model name and the property key is the field name. The SQL column string is free [V]. `usePlural: false` gives singular keys.

```ts
// src/db/schema/auth.ts  (matches better-auth 1.7.7 core tables + role + stripe plugin; CLI-style)
import { pgTable, text, timestamp, boolean, integer, bigint, index } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),                        // string ids generated by Better Auth (advanced.database.generateId)
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  role: text("role").default("patient").notNull(),    // additionalFields.role
  stripeCustomerId: text("stripe_customer_id"),       // @better-auth/stripe (always added, nullable)
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_userId_idx").on(t.userId)]);   // CLI name pattern: `${table}_${field}_idx`

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),               // = user.id for providerId "credential"
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),                            // scrypt hash
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
}, (t) => [index("account_userId_idx").on(t.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);

// @better-auth/stripe, only when subscription.enabled (all 16 plugin fields; missing any -> SCHEMA_MISMATCH)
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),                          // lowercased plan name
  referenceId: text("reference_id").notNull(),           // user.id (or org id)
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("incomplete"),          // CLI may also add .notNull() [U]
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  seats: integer("seats"),
  billingInterval: text("billing_interval"),             // "day" | "week" | "month" | "year"
  stripeScheduleId: text("stripe_schedule_id"),
});

// only when rateLimit.storage === "database"; export key MUST be `rateLimit`
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(), // ms epoch, JS default Date.now()
});
```

- Field lists come from `@better-auth/core@1.7.7/dist/db/get-tables.mjs` and the stripe plugin schema [V].
- `{ withTimezone: true }` on timestamps is fine. The CLI doesn't emit it, and the schema check ignores types [V].
- Index names are cosmetic [V].
- The session table is omitted when `secondaryStorage` is set, unless `session.storeSessionInDatabase` [V].

---

## 7. @better-auth/stripe 1.7.7

```ts
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

function stripeOptions() {
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!); // omit apiVersion -> SDK-pinned version
  return {
    stripeClient,                                          // required
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!, // required
    createCustomerOnSignUp: false,   // true: user.create.after hook; errors are logged, never block sign-up [V]
    // onCustomerCreate: async ({ stripeCustomer, user }, ctx) => {},
    // getCustomerCreateParams: async (user, ctx) => ({ metadata: {} }),   // no health data in Stripe metadata
    onEvent: async (event: Stripe.Event) => {},            // every webhook event
    subscription: {
      enabled: true,
      requireEmailVerification: true,                      // -> 400 EMAIL_VERIFICATION_REQUIRED
      plans: [                                             // or async () => StripePlan[]
        {
          name: "base",                                    // stored lowercased
          priceId: process.env.STRIPE_PRICE_BASE!,         // or lookupKey
          // annualDiscountPriceId / annualDiscountLookupKey, limits, group, seatPriceId, prorationBehavior, lineItems,
          // freeTrial: { days: 14, onTrialStart(sub), onTrialEnd({ subscription }, ctx), onTrialExpired(sub, ctx) }
        },
      ],
      // Only consulted for orgs, or when an explicit referenceId != session.user.id (see notes)
      authorizeReference: async ({ user, session, referenceId, action }, ctx) => referenceId === user.id,
      // action: "upgrade-subscription" | "list-subscription" | "cancel-subscription" | "restore-subscription" | "billing-portal"
      getCheckoutSessionParams: async ({ user, session, plan, subscription }, request, ctx) => ({
        params: { allow_promotion_codes: true },           // Stripe.Checkout.SessionCreateParams
        options: { idempotencyKey: `checkout_${user.id}_${plan.name}` },
      }),
      onSubscriptionComplete: async ({ event, stripeSubscription, subscription, plan }, ctx) => {}, // via Checkout
      onSubscriptionCreated: async ({ event, stripeSubscription, subscription, plan }) => {},       // outside Checkout
      onSubscriptionUpdate: async ({ event, stripeSubscription, subscription }) => {},
      onSubscriptionCancel: async ({ event, stripeSubscription, subscription, cancellationDetails }) => {},
      onSubscriptionDeleted: async ({ event, stripeSubscription, subscription }) => {},
    },
  } satisfies Parameters<typeof stripe>[0];
}
```

**Webhook** `POST {BETTER_AUTH_URL}/api/auth/stripe/webhook` [V]:
- Required events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- The plugin reads the raw body (`request.text()`) and calls `stripe.webhooks.constructEventAsync`.
- Errors: `STRIPE_SIGNATURE_NOT_FOUND`, 400 `FAILED_TO_CONSTRUCT_STRIPE_EVENT`, 500 `STRIPE_WEBHOOK_SECRET_NOT_FOUND`.
- Local testing: `stripe listen --forward-to localhost:3000/api/auth/stripe/webhook`.

**Endpoints** (registered only when `subscription.enabled`; the webhook is always registered) [V]:

| Client | Server | Path | Body (required in bold) | Returns |
|---|---|---|---|---|
| `subscription.upgrade` | `upgradeSubscription` | POST /subscription/upgrade | **plan**, annual, referenceId, subscriptionId, customerType, metadata, seats, locale, successUrl (default `/`), cancelUrl (default `/`), returnUrl, scheduleAtPeriodEnd, disableRedirect | new: `{...checkoutSession, redirect}`; change: `{ url, redirect }` |
| `subscription.list` | `listActiveSubscriptions` | GET /subscription/list | query: referenceId?, customerType? | subscriptions (+ `limits`, `priceId`) |
| `subscription.cancel` | `cancelSubscription` | POST /subscription/cancel | **returnUrl**, referenceId, subscriptionId, customerType, disableRedirect | `{ url, redirect }` (Billing Portal cancel flow) |
| `subscription.restore` | `restoreSubscription` | POST /subscription/restore | referenceId, subscriptionId, customerType | undoes pending cancel or scheduled change |
| `subscription.billingPortal` | `createBillingPortal` | POST /subscription/billing-portal | returnUrl (default `/`), locale, referenceId, customerType, disableRedirect | `{ url, redirect }` |
| - | `subscriptionSuccess` | GET /subscription/success | (internal) | your `successUrl` is routed through here; it syncs from Stripe, then redirects |

```ts
// client
const { data, error } = await authClient.subscription.upgrade({ plan: "base", successUrl: "/provider/billing?ok=1", cancelUrl: "/provider/billing" });
await authClient.subscription.billingPortal({ returnUrl: "/provider/billing" });
const { data: subs } = await authClient.subscription.list();
const active = subs?.find((s) => s.status === "active" || s.status === "trialing");

// server action (needs the session cookies)
const res = await auth.api.upgradeSubscription({
  body: { plan: "base", successUrl, cancelUrl, disableRedirect: true },
  headers: await headers(),
});
redirect(res.url!); // url exists in both return shapes
```

**Notes:**
- Statuses (the `status` column) [V]: `"active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid"`.
- A cancel keeps `active` with `cancelAtPeriodEnd=true` (plus `cancelAt` / `canceledAt`) until the period ends. Only then does it become `canceled` [V].
- Period dates are read from the **subscription item** (`items.data[].current_period_*`), which matches the new Stripe API [V].
- **`authorizeReference` doesn't restrict who can subscribe.** For `customerType: "user"` it only runs when an explicit `referenceId` differs from `session.user.id` [V, `referenceMiddleware`].
  - A missing hook there gives `REFERENCE_ID_NOT_ALLOWED`; a false return gives `UNAUTHORIZED`. Orgs always call it, or throw `AUTHORIZE_REFERENCE_REQUIRED`.
  - Any signed-in, verified user can POST `/api/auth/subscription/upgrade` directly. Gate with `hooks.before` (section 1).
- Upgrading with an existing active or trialing subscription updates it in place. `ALREADY_SUBSCRIBED_PLAN` is thrown if nothing changed [V, code].
  - The docs say to pass `subscriptionId` to avoid duplicates. Pass it when you have it.
- Upgrade creates the Stripe customer if it's missing (`UNABLE_TO_CREATE_CUSTOMER` on failure) [V/U].
- `createCustomerOnSignUp` links an existing Stripe customer found by email only if the user's email is verified and the customer's `metadata.userId` matches [V].

**Running without keys (conditional plugin):**
- Omit the plugin and `/api/auth/stripe/webhook` plus all `/subscription/*` routes are simply not registered (404).
- `auth.api.upgradeSubscription` is `undefined` at runtime, so guard before calling.
- The `subscription` table and `user.stripeCustomerId` can stay in the schema. The schema check only covers what the active config writes, and extra nullable columns are fine [V].
- Don't construct `new Stripe(undefined)`; just skip the plugin.
- The client can keep `stripeClient({ subscription: true })`. Calls should come back as `{ error: { status: 404 } }` because the client proxy builds paths from property names [U]. Hide billing UI with a server-provided flag.
- TypeScript: a conditional spread makes the plugins array a union, so `auth.api` endpoint inference for stripe is [U]. Casting a typed subset is fine.

---

## 8. PGlite + Drizzle in Next.js 16 (dev) / postgres-js (prod)

```ts
// src/db/index.ts
import "server-only";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>; // common supertype of both drivers [U: compile-check]

function create(): { db: DB; ready: Promise<void> } {
  const url = process.env.DATABASE_URL;
  if (url) {
    const postgres = require("postgres") as typeof import("postgres");
    // prepare:false only needed behind a transaction pooler (Supabase :6543, Neon -pooler)
    return { db: drizzlePg({ client: postgres(url, { prepare: false, max: 5 }), schema }), ready: Promise.resolve() };
  }
  if (process.env.VERCEL) throw new Error("DATABASE_URL is required on Vercel (no persistent disk).");
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  const client = new PGlite(path.join(process.cwd(), ".data", "pglite")); // no prefix / file:// = NodeFS; "memory://" = RAM
  const db = drizzlePglite({ client, schema });     // or drizzle(".data/pglite") / drizzle({ connection: { dataDir } })
  const ready = migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") }); // migrationsFolder REQUIRED on 0.45
  return { db, ready };
}

const g = globalThis as unknown as { __db?: ReturnType<typeof create> }; // survives HMR + separate module graphs
const handle = (g.__db ??= create());
export const db = handle.db;
export const dbReady = handle.ready; // await before first query (auth route, actions) on a fresh dir
```

- `PGlite.create(dir, opts)` is the preferred async constructor (awaits `waitReady`, types extensions) [V]. `new PGlite()` is sync; queries wait for ready automatically. That's what lets `drizzleAdapter(db)` stay synchronous.
- drizzle 0.45 signatures [V]:
  - `drizzle()`, `drizzle(clientOrPath)`, `drizzle(clientOrPath, config)`, `drizzle({ client | connection, schema, ... })`.
  - Each returns `PgliteDatabase<S> & { $client }`.
  - `migrate(db, { migrationsFolder, migrationsTable?, migrationsSchema? })`, with migrations tracked in `drizzle.__drizzle_migrations`.

**Next.js / Turbopack caveats (important):**
1. **`serverExternalPackages: ["@electric-sql/pglite"]`** in `next.config.ts`.
   - It's not in Next 16's built-in list (checked `node_modules/next/dist/lib/server-external-packages.jsonc`, 16.2.12; `pg` is there, PGlite isn't).
   - PGlite finds `pglite.wasm` via `new URL("pglite.wasm", import.meta.url)` and reads `pglite.data` (6.3 MB) and the 10 MB wasm with `fs` [V, dist source].
   - When bundled, those files must sit next to the emitted chunk. Externalizing loads them from `node_modules` [U: no official Next 16 doc].
   - The PGlite bundler page only gives a client-side recipe: `transpilePackages: ["@electric-sql/pglite"]` plus `swcMinify: false`, an option that no longer exists [V].
2. **Known Turbopack bugs are client-side:**
   - vercel/next.js#98294 (Next 16.3.0, PGlite 0.5.8, opened 2026-09-05): `next build` minified client bundle throws `TypeError: h.instantiateWasm is not a function`; `next dev` works.
   - Workarounds: `experimental.turbopackMinify: false`, or a `/* turbopackIgnore: true */` dynamic import. It was auto-closed for a missing repro, with no fix noted.
   - PGlite multi-tab workers don't work with Turbopack (pglite#632).
   - None of this is an issue for server-only use with externalization, but **never import the PGlite db into client code**.
3. **No data-dir lock.** `dist/fs/nodefs.js` has no lockfile or pid check [V]. Two processes on `.data/pglite` will corrupt it, so never run two of these at once:
   - `next dev`
   - `drizzle-kit migrate/studio/push` (with `driver: "pglite"`)
   - `npx auth generate` (it evaluates your db module)
   - `vitest` with the real dir
   - `next build` static-generation workers, if pages touch the DB at build time
4. HMR re-evaluates modules, so the `globalThis` singleton is mandatory [U, standard pattern].
5. Production needs `@electric-sql/pglite` resolvable at **build** time, even if only the dev branch `require`s it. Keep it in `dependencies`, or guard the import. Turbopack resolves externals at build.
6. **Optional, avoids all of the above:**
   - Run PGlite as a server: `npx pglite-server --db=.data/pglite --port=5433` (`@electric-sql/pglite-socket@0.2.11`; it multiplexes many clients over PGlite's single connection; no SSL).
   - Then set `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres` and use postgres-js everywhere. drizzle-kit can migrate while the app runs.
   - Caveat: its peer deps are **pinned exactly** (`@electric-sql/pglite: 0.5.8`, plus several `pglite-*` extension packages) [V].
7. Windows paths with NodeFS: untested here [U].

---

## 9. drizzle-kit (0.31) config, generating and applying migrations

```ts
// drizzle.config.ts
import { loadEnvConfig } from "@next/env";     // drizzle-kit doesn't read .env.local [U]; @next/env ships with next
import { defineConfig } from "drizzle-kit";
loadEnvConfig(process.cwd());

const base = { dialect: "postgresql", schema: "./src/db/schema/index.ts", out: "./drizzle", strict: true } as const;

export default process.env.DATABASE_URL
  ? defineConfig({ ...base, dbCredentials: { url: process.env.DATABASE_URL } })
  : defineConfig({ ...base, driver: "pglite", dbCredentials: { url: "./.data/pglite" } }); // stop `next dev` first
```

```bash
npx drizzle-kit generate   # schema diff -> ./drizzle/NNNN_name.sql + meta/ snapshots
npx drizzle-kit migrate    # apply to DATABASE_URL (postgres-js is used if installed) or to PGlite via driver:"pglite"
npx drizzle-kit push       # dev-only, no SQL files
```

- `driver` takes `"aws-data-api" | "pglite"`. For PGlite, `dbCredentials.url` is the data folder or `":memory:"` [V].
- `migrations: { table, schema }` defaults to `__drizzle_migrations` in schema `drizzle` [V].
- `breakpoints` defaults to true [V].
- The same `./drizzle` SQL works for PGlite (PG 18) and hosted Postgres.
- PGlite: apply it at runtime with `migrate()` from `drizzle-orm/pglite/migrator` (section 8), or with the CLI while the dev server is stopped.

---

## Cross-check vs current repo code (2026-10-08)

1. **`src/db/schema/auth.ts` `subscription` is missing `billingInterval` (`billing_interval`) and `stripeScheduleId` (`stripe_schedule_id`).** They're also missing from `drizzle/0000_init.sql`.
   - With the Stripe plugin loaded, `validateSchema` (on by default) will fail auth requests with `SCHEMA_MISMATCH`.
   - Fix: add both columns and generate a migration, or set `advanced.database.validateSchema: false` (not advised).
2. **`authorizeReference` in `src/server/auth/index.ts` won't stop patients or unapproved providers subscribing.** It's skipped when `referenceId` is the user's own id.
   - `startCheckout()` checks the role, but `/api/auth/subscription/upgrade` is callable directly.
   - Add the `hooks.before` guard from section 1. It should check role `provider` and approval status.
3. `package.json` doesn't list better-auth, drizzle, pglite, postgres or stripe yet. When adding them, use **stripe@^22**, not 23 (peer range).
4. The comment "Keep in sync with `npx @better-auth/cli generate`" is out of date. The CLI is now `npx auth@1.7.7 generate`, and it won't load a config with `import "server-only"`.
5. `onSubscriptionDeleted` and `onSubscriptionCreated` aren't wired to `onSubscriptionChange`.
   - A deleted subscription (status `canceled`) won't hit your sync.
   - Neither will one created outside Checkout.
6. `getSession()` in `src/server/auth/session.ts` doesn't `await dbReady`. That only matters on the very first request against a fresh PGlite dir.
7. `sendResetPassword` / `sendVerificationEmail` `await` the send. The docs advise not awaiting (timing side channel); use `after()`.

---

## Sources

- Better Auth docs:
  - Next.js: https://www.better-auth.com/docs/integrations/next
  - Drizzle adapter: https://better-auth.com/docs/adapters/drizzle.md
  - Email and password: https://www.better-auth.com/docs/authentication/email-password
  - Email: https://better-auth.com/docs/concepts/email.md
  - API: https://better-auth.com/docs/concepts/api.md
  - Database: https://better-auth.com/docs/concepts/database (raw: https://raw.githubusercontent.com/better-auth/better-auth/v1.7.7/docs/content/docs/concepts/database.mdx)
  - CLI: https://better-auth.com/docs/concepts/cli
  - Options: https://better-auth.com/docs/reference/options.md
  - Session management: https://better-auth.com/docs/concepts/session-management.md
  - Rate limit: https://better-auth.com/docs/concepts/rate-limit.md
  - TypeScript: https://better-auth.com/docs/concepts/typescript.md
  - Hooks: https://better-auth.com/docs/concepts/hooks.md
  - Google: https://better-auth.com/docs/authentication/google.md
  - Security: https://better-auth.com/docs/reference/security.md
  - Stripe plugin: https://better-auth.com/docs/plugins/stripe.md
- Package source (unpkg):
  - better-auth@1.7.7: `package.json`, `dist/api/routes/{sign-up,sign-in,password,email-verification,update-user}.mjs`, `dist/api/index.mjs`, `dist/cookies/*`, `dist/db/schema.mjs`, `dist/integrations/next-js.d.mts`
  - @better-auth/core@1.7.7: `dist/db/{get-tables,database-index,schema-check,schema-diff,type}.*`, `dist/error/*`, `dist/types/init-options.d.mts`, `dist/oauth2/oauth-provider.d.mts`, `dist/social-providers/index.d.mts`
  - @better-auth/drizzle-adapter@1.7.7: `index.*`, `generate-drizzle-schema`, `schema-check`
  - @better-auth/stripe@1.7.7: `package.json`, `dist/index.mjs`, `dist/*.d.mts`
  - auth@1.7.7 (CLI): `dist/index.mjs`
  - better-call@1.4.0: `dist/error.d.mts`
  - drizzle-orm@0.45.3: `pglite/{driver,migrator}.d.ts`, `postgres-js/driver.d.ts`, `migrator.d.ts`
  - drizzle-kit@0.31.11: `package.json`
  - @electric-sql/pglite@0.5.8: `package.json`, `dist/index.js`, `dist/fs/nodefs.js`
  - @electric-sql/pglite-socket@0.2.11: `package.json`
  - stripe@23.0.0: `package.json`
- Stripe Node changelog: https://raw.githubusercontent.com/stripe/stripe-node/master/CHANGELOG.md
- Drizzle docs: https://orm.drizzle.team/docs/connect-pglite, https://orm.drizzle.team/docs/drizzle-config-file, https://orm.drizzle.team/docs/migrations
- PGlite docs:
  - https://pglite.dev/docs/
  - https://pglite.dev/docs/api
  - https://pglite.dev/docs/bundler-support
  - https://pglite.dev/docs/pglite-socket
  - Changelog: https://raw.githubusercontent.com/electric-sql/pglite/main/packages/pglite/CHANGELOG.md
- Next.js docs: https://nextjs.org/docs/app/api-reference/file-conventions/proxy, https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
- GitHub issues:
  - https://github.com/vercel/next.js/issues/98294
  - https://github.com/electric-sql/pglite/issues/632
  - https://github.com/electric-sql/pglite/issues/1120 (PGlite `pglite.data` ENOENT when bundled under Nitro: same failure mode)
