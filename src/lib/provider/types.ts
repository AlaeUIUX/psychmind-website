import type { BannerStyle } from "@/lib/taxonomy";

/** Everything the public profile renders. Partial while a provider is still
 *  onboarding — the preview shows placeholders for what's missing. */
export type ProfileView = {
  firstName?: string;
  lastName?: string;
  businessName?: string | null;
  displayAsBusiness?: boolean;
  titleCredentials?: string;
  pronouns?: string | null;
  bannerStyle?: BannerStyle | null;
  photoUrl?: string | null;
  verified?: boolean;
  whoYouWorkWith?: string;
  about?: string;
  sessionParticipants?: string[];
  ageGroups?: string[];
  specialties?: string[];
  primarySpecialty?: string | null;
  approaches?: string[];
  languages?: string[];
  gender?: string | null;
  feeIndividual?: number | null;
  feeCouples?: number | null;
  slidingScale?: boolean;
  acceptingNewClients?: boolean;
  education?: { degree: string; school: string; year: number | null }[];
  yearsExperience?: number | null;
  licenses?: { state: string; licenseNumber: string; verified?: boolean }[];
  locations?: { state: string; city: string; zip?: string; formats: string[]; isPrimary: boolean }[];
};

export const PROVIDER_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "rejected",
  "suspended",
] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];
