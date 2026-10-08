import { APPROACHES, SPECIALTIES } from "@/lib/taxonomy";

// "What's on your mind?": everyday words matched to specialties and
// approaches ("panic" → Anxiety, "ptsd" → Trauma & PTSD), with whatever's
// left matched against what providers wrote about themselves.
// TODO(client): review the word lists.

const SPECIALTY_WORDS: Record<string, string[]> = {
  anxiety: ["anxiety", "anxious", "panic", "worry", "worried", "worrying", "nervous", "phobia", "fear", "fears"],
  grief_loss: ["grief", "grieving", "loss", "bereavement", "mourning", "death", "died", "passed"],
  burnout: ["burnout", "burned", "burnt", "exhausted", "exhaustion", "overwork", "overworked"],
  relationships: ["relationship", "relationships", "couple", "couples", "marriage", "married", "partner", "dating", "breakup", "divorce", "family"],
  cultural_identity: ["cultural", "culture", "identity", "immigrant", "immigration", "bicultural", "racism", "race"],
  trauma_ptsd: ["trauma", "traumatic", "ptsd", "abuse", "abused", "assault", "accident", "violence"],
  depression: ["depression", "depressed", "sad", "sadness", "hopeless", "hopelessness", "unmotivated"],
  self_esteem: ["esteem", "confidence", "confident", "worth", "insecure", "insecurity"],
  life_transitions: ["transition", "transitions", "change", "changes", "moving", "move", "retirement", "career"],
  stress: ["stress", "stressed", "pressure", "overwhelmed", "overwhelm"],
  ocd: ["ocd", "obsessive", "compulsive", "intrusive"],
  bipolar: ["bipolar", "mania", "manic"],
  sleep: ["sleep", "insomnia", "sleeping", "nightmares"],
  adhd: ["adhd", "attention", "focus", "focusing", "distracted"],
  addiction: ["addiction", "addicted", "substance", "alcohol", "drinking", "drugs", "sober", "sobriety", "gambling"],
  eating_disorders: ["eating", "anorexia", "bulimia", "binge", "bingeing", "food", "body"],
  chronic_illness: ["chronic", "illness", "pain", "diagnosis", "disability"],
  parenting: ["parenting", "parent", "parents", "kids", "children", "child", "mom", "dad", "postpartum", "family"],
  lgbtq: ["lgbtq", "lgbt", "gay", "lesbian", "queer", "trans", "transgender", "bisexual", "nonbinary"],
};

const APPROACH_WORDS: Record<string, string[]> = Object.fromEntries(
  APPROACHES.map((a) => [a.value, a.label.toLowerCase().replace(/[()]/g, " ").split(/[\s-]+/).filter((w) => w.length > 2)]),
);
APPROACH_WORDS.cbt.push("cognitive");
APPROACH_WORDS.dbt.push("dialectical");
APPROACH_WORDS.act.push("acceptance");

const STOP = new Set(
  "a an and any are as at be been but by can could do for from get got have help i i'm im in into is it its just like me my need of on or our so some someone that the their them they this to want was we with would you your about".split(
    " ",
  ),
);

export type TextQuery = {
  /** The words we kept (lowercased, no filler). */
  words: string[];
  specialties: string[];
  approaches: string[];
};

export function parseQuery(input: string | null | undefined): TextQuery | null {
  const words = (input ?? "")
    .toLowerCase()
    .slice(0, 120)
    .replace(/[^\p{L}\p{N}\s'+-]/gu, " ")
    .split(/[\s-]+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
  if (!words.length) return null;
  const hits = (table: Record<string, string[]>) =>
    Object.entries(table)
      .filter(([, list]) => words.some((w) => list.includes(w)))
      .map(([value]) => value);
  return { words: Array.from(new Set(words)), specialties: hits(SPECIALTY_WORDS), approaches: hits(APPROACH_WORDS) };
}

/** Specialty suggestions for what someone is typing ("anx" → Anxiety). */
export function suggestSpecialties(input: string, limit = 6) {
  const t = input.trim().toLowerCase();
  if (!t) return [];
  return SPECIALTIES.filter(
    (s) => s.label.toLowerCase().includes(t) || (SPECIALTY_WORDS[s.value] ?? []).some((w) => w.startsWith(t)),
  ).slice(0, limit);
}
