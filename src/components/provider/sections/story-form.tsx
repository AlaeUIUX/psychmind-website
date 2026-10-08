"use client";

import { cn } from "cn";
import { LightbulbIcon } from "lucide-react";
import { useCallback } from "react";
import { describedBy } from "@/components/forms/form-row";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { storySchema, type StoryInput } from "@/lib/provider/schema";
import { SectionFooter, type SectionProps, useSectionForm } from "./shared";

const MAX_WORDS = 1600;
const countWords = (text = "") => text.split(/\s+/).filter(Boolean).length;

// Writing help, no AI. Prompts are new copy (TODO(client)); the examples are
// Figma's own sample answers for Sara Oliisi (approved copy).
const GUIDE = {
  whoYouWorkWith: {
    prompts: ["Who do you work best with?", "What usually brings them to you?", "What should someone who's hesitant know?"],
    example:
      "I primarily work with adults (18+) on an individual basis, though I also offer couples sessions. My clients often come to me when they feel like they've tried to manage things on their own and need a different kind of support — not advice, but a space to think more clearly.\n\nI work especially well with people who are skeptical about therapy, or who have tried it before and felt it wasn't quite right. I take that seriously and we talk about it openly.",
  },
  about: {
    prompts: ["How do your sessions feel?", "What's your approach, in plain words?", "What happens in a first session?"],
    example:
      "I work with adults who feel stuck, overwhelmed, or disconnected from the life they want to be living. Many of my clients are navigating anxiety, stress, relationship challenges, or questions about identity — and they've often been carrying these things alone for a long time before reaching out.\n\nMy approach is collaborative and paced to your comfort. I don't believe therapy should feel like homework or a checklist. I believe it should feel like a conversation where you are genuinely heard — sometimes for the first time.",
  },
} as const;

function StoryField({
  id,
  label,
  error,
  value,
  register,
}: {
  id: keyof typeof GUIDE;
  label: string;
  error?: string;
  value?: string;
  register: React.ComponentProps<typeof Textarea>;
}) {
  const words = countWords(value);
  const guide = GUIDE[id];
  return (
    <Field data-invalid={error ? true : undefined} className="gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={id} className="text-text-primary">
          {label}
          <span aria-hidden className="text-destructive">
            *
          </span>
        </FieldLabel>
        <span
          className={cn(
            "type-ui-mono",
            words > MAX_WORDS ? "text-red-600" : words > MAX_WORDS * 0.9 ? "text-amber-600" : "text-warm-400",
          )}
          aria-live="polite"
        >
          {words.toLocaleString()} / {MAX_WORDS.toLocaleString()}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {guide.prompts.map((p) => (
          <span key={p} className="rounded-md bg-warm-100 px-2 py-1 type-ui-caption text-warm-600">
            {p}
          </span>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 type-ui-caption font-medium text-warm-800 underline-offset-2 hover:underline">
              <LightbulbIcon className="size-3.5 text-amber-600" />
              See an example
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="app-ui w-[min(420px,90vw)]">
            <p className="type-ui-label text-warm-900">Example from a provider profile</p>
            <p className="mt-2 type-ui-small whitespace-pre-line text-warm-600">{guide.example}</p>
          </PopoverContent>
        </Popover>
      </div>
      <Textarea
        id={id}
        rows={7}
        className="min-h-44"
        aria-invalid={!!error}
        aria-describedby={describedBy(id, { hint: true, error })}
        {...register}
      />
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : <FieldDescription id={`${id}-hint`}>Maximum 1600 words.</FieldDescription>}
    </Field>
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      <StoryField id="whoYouWorkWith" label="Who you work with" error={e.whoYouWorkWith?.message} value={watch("whoYouWorkWith")} register={register("whoYouWorkWith")} />
      <StoryField id="about" label="About you" error={e.about?.message} value={watch("about")} register={register("about")} />
      <SectionFooter mode={mode} backHref={backHref} pending={pending} dirty={formState.isDirty} />
    </form>
  );
}
