"use client";

import { cn } from "cn";
import { useCallback } from "react";
import { FormRow, describedBy } from "@/components/forms/form-row";
import { Textarea } from "@/components/ui/textarea";
import { storySchema, type StoryInput } from "@/lib/provider/schema";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

const MAX_WORDS = 1600;
const countWords = (text = "") => text.split(/\s+/).filter(Boolean).length;

function WordCount({ text }: { text?: string }) {
  const n = countWords(text);
  return (
    <span className={cn("type-caption tabular-nums", n > MAX_WORDS ? "text-destructive" : "text-text-placeholder")}>
      {n.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
    </span>
  );
}

// Figma P3 "Your story": two long-form answers, plain text with paragraphs.
export function StoryForm({ state, mode, onPreview, backHref, nextHref }: SectionProps) {
  const toPreview = useCallback((v: StoryInput) => ({ whoYouWorkWith: v.whoYouWorkWith, about: v.about }), []);
  const { form, onSubmit, pending } = useSectionForm({
    section: "story",
    schema: storySchema,
    mode,
    nextHref,
    onPreview,
    toPreview,
    defaultValues: { whoYouWorkWith: state.whoYouWorkWith, about: state.about },
  });
  const { register, formState, watch } = form;
  const e = formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormRow id="whoYouWorkWith" label="Who you work with" required hint="Maximum 1600 words." error={e.whoYouWorkWith?.message}>
        <Textarea
          id="whoYouWorkWith"
          rows={7}
          className="min-h-40"
          aria-invalid={!!e.whoYouWorkWith}
          aria-describedby={describedBy("whoYouWorkWith", { hint: true, error: e.whoYouWorkWith })}
          {...register("whoYouWorkWith")}
        />
        <WordCount text={watch("whoYouWorkWith")} />
      </FormRow>
      <FormRow id="about" label="About you" required hint="Maximum 1600 words." error={e.about?.message}>
        <Textarea
          id="about"
          rows={7}
          className="min-h-40"
          aria-invalid={!!e.about}
          aria-describedby={describedBy("about", { hint: true, error: e.about })}
          {...register("about")}
        />
        <WordCount text={watch("about")} />
      </FormRow>
      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
