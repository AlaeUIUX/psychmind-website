"use client";

import { createAuthClient } from "better-auth/react";

// Browser-side auth: used for Google sign-in redirects and sign-out. Email
// sign-up/in run as server actions (src/server/auth/actions.ts) so roles and
// redirects are decided on the server.
export const authClient = createAuthClient();
