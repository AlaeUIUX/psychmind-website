// Labels for account recovery requests (admin list and detail page). Kept
// out of the "use client" decision panel so server pages can read it.
export const RECOVERY_BADGE = {
  open: { variant: "warning", label: "Waiting" },
  completed: { variant: "success", label: "Account moved" },
  declined: { variant: "neutral", label: "Declined" },
} as const;
