import "server-only";

/** Who the admins are: ADMIN_EMAILS, comma-separated. An account is created
 *  for each address (server/admin/accounts.ts); nobody signs up as an admin.
 *  Taking an address off the list takes admin away at the next sign-in. */
export function listedAdminEmails(): string[] {
  return Array.from(
    new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export const isAdminEmail = (email: string) => listedAdminEmails().includes(email.trim().toLowerCase());
