import "server-only";

/** Which optional sign-in methods are configured (server-side env). */
export const authFeatures = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
};
