import { randomInt } from "node:crypto";

// Temporary passwords for new admins (server/admin/accounts.ts): easy to read
// and type from an email, hard to guess.

/** Letters and digits that can't be mistaken for each other (no 0/O, 1/I/L). */
export const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** How a temporary password looks: four groups of four. */
export const TEMP_PASSWORD_PATTERN = /^[A-HJKMNP-Z2-9]{4}(?:-[A-HJKMNP-Z2-9]{4}){3}$/;

/** "K7PX-M2QD-9WFH-T4RA": 16 random characters from 31, about 79 bits. */
export function temporaryPassword() {
  const group = () => Array.from({ length: 4 }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]).join("");
  return [group(), group(), group(), group()].join("-");
}
