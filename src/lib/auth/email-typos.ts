// "Did you mean …@gmail.com?" — catches the common domain slips that would
// send a verification email nowhere.

const DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "live.com",
  "msn.com",
  "me.com",
  "comcast.net",
  "protonmail.com",
  "proton.me",
];

function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** A corrected address, or null if the domain looks fine. */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || DOMAINS.includes(domain)) return null;
  let best: string | null = null;
  let bestScore = 3;
  for (const d of DOMAINS) {
    const score = distance(domain, d);
    if (score > 0 && score < bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best ? `${email.slice(0, at)}@${best}` : null;
}

/** Webmail shortcuts for the "check your email" screen. */
export function inboxLink(email: string): { label: string; href: string } | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") return { label: "Open Gmail", href: "https://mail.google.com/mail/u/0/#search/from%3Apsychmind" };
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) return { label: "Open Outlook", href: "https://outlook.live.com/mail/0/" };
  if (domain === "yahoo.com") return { label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" };
  if (["icloud.com", "me.com"].includes(domain)) return { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" };
  return null;
}

/** 0–4 password strength for the meter (8+ characters is the only hard rule). */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) score = Math.min(score, 1);
  const s = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;
  return { score: s, label: ["", "Too weak", "Okay", "Good", "Strong"][s] };
}
