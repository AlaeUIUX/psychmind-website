// The optional emails, by role, for Settings → Email notifications. Every
// kind is on until someone turns it off. Anything not listed here (sign-up,
// passwords, email changes, verification decisions, billing, recovery) is
// always sent. TODO(client): copy.

export type NotificationRole = "patient" | "provider" | "admin";

export const NOTIFICATION_KINDS = {
  session_requests: {
    roles: ["provider"],
    label: "New session requests",
    description: "An email with each request, sent to your requests address. When it's off, requests still arrive under Requests.",
  },
  onboarding_reminders: {
    roles: ["provider"],
    label: "Reminders to finish your profile",
    description: "Up to three reminders while your profile is still a draft.",
  },
  admin_submissions: {
    roles: ["admin"],
    label: "New providers to verify",
    description: "When a provider submits their profile for review.",
  },
  admin_recovery: {
    roles: ["admin"],
    label: "Account recovery requests",
    description: "When someone asks support to move their account to a new email.",
  },
  marketing: {
    roles: ["patient", "provider", "admin"],
    label: "News and tips from PsychMind",
    description: "Occasional news about PsychMind and tips for getting the most from it.",
  },
} as const satisfies Record<string, { roles: readonly NotificationRole[]; label: string; description: string }>;

export type NotificationKind = keyof typeof NOTIFICATION_KINDS;

export const isNotificationKind = (value: unknown): value is NotificationKind =>
  typeof value === "string" && Object.hasOwn(NOTIFICATION_KINDS, value);

export const kindsFor = (role: NotificationRole) =>
  (Object.keys(NOTIFICATION_KINDS) as NotificationKind[]).filter((k) => (NOTIFICATION_KINDS[k].roles as readonly string[]).includes(role));

/** What always goes out, whatever the switches say. */
export const ALWAYS_SENT: Record<NotificationRole, string> = {
  patient: "Account and security emails, and the confirmation for each session request you send, always go out.",
  provider: "Account and security emails, verification decisions and billing emails always go out.",
  admin: "Account and security emails always go out.",
};
