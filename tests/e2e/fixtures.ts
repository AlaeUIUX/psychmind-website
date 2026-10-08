// Test-only values for the local app (PGlite database, /dev/mail outbox).
// Never real accounts: the .test domain can't receive mail.
export const TEST_PASSWORD = "Calm-Harbor-2026!";
export const ADMIN_EMAIL = "admin@psychmind.test"; // matches ADMIN_EMAILS in .env.local
export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@psychmind.test`;
