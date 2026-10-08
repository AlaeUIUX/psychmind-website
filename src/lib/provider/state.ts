import type { BannerStyle } from "@/lib/taxonomy";
import type { ProfileView, ProviderStatus } from "./types";

// The serialisable snapshot of a provider's profile that server pages hand to
// the wizard and editor (client components). Loaded in src/server/provider.

export type UploadMeta = { id: string; fileName: string; size: number; mimeType: string };

export type ProviderState = {
  id: string;
  status: ProviderStatus;
  onboardingStep: string;
  reviewNote: string | null;
  needsReview: boolean;
  extraLocations: number;
  firstName: string;
  lastName: string;
  businessName: string;
  displayAsBusiness: boolean;
  titleCredentials: string;
  pronouns: string;
  bannerStyle: BannerStyle;
  photo: UploadMeta | null;
  whoYouWorkWith: string;
  about: string;
  sessionParticipants: string[];
  ageGroups: string[];
  specialties: string[];
  primarySpecialty: string;
  approaches: string[];
  languages: string[];
  gender: string;
  feeIndividual: number | null;
  feeCouples: number | null;
  slidingScale: boolean;
  acceptingNewClients: boolean;
  education: { degree: string; school: string; year: number | null }[];
  npiNumber: string;
  yearsExperience: number | null;
  locations: {
    id: string;
    state: string;
    city: string;
    zip: string;
    practiceName: string;
    address: string;
    formats: string[];
    isPrimary: boolean;
  }[];
  licenses: {
    id: string;
    state: string;
    licenseNumber: string;
    issuingBody: string;
    status: "pending" | "verified" | "rejected";
    document: UploadMeta | null;
  }[];
};

export const fileUrl = (id: string) => `/api/files/${id}`;

/** What the profile preview shows for a given snapshot. */
export function toProfileView(s: ProviderState): ProfileView {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    businessName: s.businessName,
    displayAsBusiness: s.displayAsBusiness,
    titleCredentials: s.titleCredentials,
    pronouns: s.pronouns,
    bannerStyle: s.bannerStyle,
    photoUrl: s.photo ? fileUrl(s.photo.id) : null,
    verified: s.status === "approved",
    whoYouWorkWith: s.whoYouWorkWith,
    about: s.about,
    sessionParticipants: s.sessionParticipants,
    ageGroups: s.ageGroups,
    specialties: s.specialties,
    primarySpecialty: s.primarySpecialty,
    approaches: s.approaches,
    languages: s.languages,
    gender: s.gender,
    feeIndividual: s.feeIndividual,
    feeCouples: s.feeCouples,
    slidingScale: s.slidingScale,
    acceptingNewClients: s.acceptingNewClients,
    education: s.education,
    yearsExperience: s.yearsExperience,
    licenses: s.licenses.map((l) => ({ state: l.state, licenseNumber: l.licenseNumber, verified: l.status === "verified" })),
    locations: s.locations,
  };
}

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };
