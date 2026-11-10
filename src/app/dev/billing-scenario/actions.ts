"use server";

import { revalidatePath } from "next/cache";
import { buildScenario, devScenarioAllowed, setStage, type Stage } from "@/server/dev/billing-scenario";

export async function buildAction() {
  if (!devScenarioAllowed()) return;
  await buildScenario();
  revalidatePath("/", "layout");
}

export async function stageAction(form: FormData) {
  if (!devScenarioAllowed()) return;
  const stage = form.get("stage");
  if (stage !== "active" && stage !== "failed" && stage !== "lapsed") return;
  await setStage(stage as Stage);
  revalidatePath("/", "layout");
}
