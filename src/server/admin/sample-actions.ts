"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/session";
import { addSampleProviders, removeSampleProviders } from "@/server/directory/samples";

// Admin → Sample providers: fill the directory with the 50 sample profiles
// (labelled as samples, never bookable) or take them all out again.

export type SampleState = { message?: string; error?: string } | null;

export async function addSamples(): Promise<SampleState> {
  const { user } = await requireRole("admin");
  try {
    const added = await addSampleProviders(user.id);
    revalidatePath("/admin", "layout");
    revalidatePath("/providers", "layout");
    return { message: added ? `Added ${added} sample providers.` : "The sample providers are already there." };
  } catch (err) {
    console.error("adding samples failed", err);
    return { error: "Couldn't add the sample providers. Please try again." };
  }
}

export async function removeSamples(): Promise<SampleState> {
  const { user } = await requireRole("admin");
  try {
    const removed = await removeSampleProviders(user.id);
    revalidatePath("/admin", "layout");
    revalidatePath("/providers", "layout");
    return { message: removed ? `Removed ${removed} sample providers.` : "There were no sample providers to remove." };
  } catch (err) {
    console.error("removing samples failed", err);
    return { error: "Couldn't remove the sample providers. Please try again." };
  }
}
