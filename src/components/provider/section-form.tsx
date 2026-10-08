"use client";

import type { SectionKey } from "@/server/provider/actions";
import { ClientsForm } from "./sections/clients-form";
import { CredentialsForm } from "./sections/credentials-form";
import { ExpertiseForm } from "./sections/expertise-form";
import { IdentityForm } from "./sections/identity-form";
import { LocationsForm } from "./sections/locations-form";
import { PictureForm } from "./sections/picture-form";
import { PracticeForm } from "./sections/practice-form";
import type { SectionProps } from "./sections/shared";
import { StoryForm } from "./sections/story-form";

const forms: Record<SectionKey, (props: SectionProps) => React.ReactNode> = {
  identity: IdentityForm,
  picture: PictureForm,
  story: StoryForm,
  clients: ClientsForm,
  expertise: ExpertiseForm,
  practice: PracticeForm,
  locations: LocationsForm,
  credentials: CredentialsForm,
};

/** The form for one profile section — shared by the wizard and the editor. */
export function SectionForm({ section, ...props }: SectionProps & { section: SectionKey }) {
  const Form = forms[section];
  return <Form {...props} />;
}
