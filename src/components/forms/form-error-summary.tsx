"use client";

import { CircleAlertIcon } from "@/components/ui/hugeicons";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFormState, type Control, type FieldErrors, type FieldValues } from "react-hook-form";

// "Check these before saving": a list of everything that needs fixing, at the
// top of a long form, after a save that didn't go through. Each line jumps to
// its field (opening a collapsed card first). Before this, a failed save on a
// step with choice chips left focus on the button and nothing scrolled, so on
// a phone it looked like nothing happened, and errors further down the step
// stayed out of sight.
//
// Lines are read from the inline errors the form already shows, so the
// wording is the same in both places. A field's label comes from its row
// (FormRow / fieldset legend); a card adds context with data-error-scope
// ("Austin, Texas"). A collapsed card with problems marks its caption with
// data-card-error: that becomes one line, and clicking it opens the card
// (useCardReveal) and focuses its first problem. TODO(client): copy.

type Item = { key: string; label: string | null; message: string; target: HTMLElement | null };

const clean = (s: string | null | undefined) =>
  (s ?? "")
    .replace(/\*/g, "")
    .replace(/\bOptional\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Every error path with a message, for noticing when the errors change. */
function errorKey(errors: FieldErrors, prefix = ""): string {
  return Object.entries(errors)
    .map(([k, v]) => {
      if (!v || typeof v !== "object") return "";
      const path = prefix ? `${prefix}.${k}` : k;
      const own = "message" in v && typeof v.message === "string" ? `${path}:${v.message}|` : "";
      return own + errorKey(v as FieldErrors, path);
    })
    .join("");
}

function readItems(form: HTMLFormElement, summary: HTMLElement | null): Item[] {
  const nodes = form.querySelectorAll<HTMLElement>('[data-slot="field-error"], [role="alert"], [data-card-error]');
  const items: Item[] = [];
  const seen = new Set<string>();
  nodes.forEach((node, i) => {
    if (summary?.contains(node) || node.closest("[data-error-summary-skip]") || node.closest("[hidden]")) return;
    const message = clean(node.textContent);
    if (!message) return;
    if (node.hasAttribute("data-card-error")) {
      const card = node.closest<HTMLElement>("[data-card-index]");
      const label = clean(card?.dataset.errorScope) || null;
      items.push({ key: `card|${label}|${i}`, label, message, target: card });
      return;
    }
    const field = node.closest<HTMLElement>('[data-slot="field"], fieldset, [data-field]');
    const labelText = clean(
      field?.querySelector('[data-slot="field-label"], legend')?.textContent ?? field?.getAttribute("aria-label") ?? null,
    );
    const scope = clean(node.closest<HTMLElement>("[data-error-scope]")?.dataset.errorScope);
    const label = [scope, labelText].filter(Boolean).join(" · ") || null;
    const id = node.id.endsWith("-error") ? node.id.slice(0, -"-error".length) : null;
    const target =
      (id && form.querySelector<HTMLElement>(`#${CSS.escape(id)}`)) ||
      field?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button, [tabindex]") ||
      field ||
      null;
    const key = `${label}|${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ key: `${key}|${i}`, label, message, target });
  });
  return items;
}

function jumpTo(item: HTMLElement | null) {
  if (!item) return;
  const card = item.hasAttribute("data-card-index") ? item : null;
  // A collapsed card opens first (useCardReveal), then its first problem gets focus.
  if (card) card.dispatchEvent(new CustomEvent("pm-reveal", { bubbles: true }));
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target =
        (card && (card.querySelector<HTMLElement>('[aria-invalid="true"]') ?? card.querySelector<HTMLElement>("input:not([type=hidden]), button"))) || item;
      target.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      target.focus({ preventScroll: true });
    }),
  );
}

/** For a list of collapsible cards: open card `data-card-index` when the
 *  summary asks. Put the returned ref on the list. */
export function useCardReveal(open: (index: number) => void) {
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });
  return useCallback((list: HTMLElement | null) => {
    if (!list) return;
    const onReveal = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card-index]");
      if (card) openRef.current(Number(card.dataset.cardIndex));
    };
    list.addEventListener("pm-reveal", onReveal);
    return () => list.removeEventListener("pm-reveal", onReveal);
  }, []);
}

export function FormErrorSummary<T extends FieldValues, C, O extends FieldValues>({ control }: { control: Control<T, C, O> }) {
  const { errors, submitCount, isSubmitting } = useFormState({ control });
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const key = errorKey(errors);
  const announced = useRef(0);

  // Read the inline errors once they've rendered.
  useLayoutEffect(() => {
    const form = ref.current?.closest("form");
    setItems(form && submitCount > 0 && key ? readItems(form, ref.current) : []);
  }, [key, submitCount]);

  // After each save that didn't go through, bring the summary into view.
  useEffect(() => {
    if (isSubmitting || !items.length || announced.current === submitCount) return;
    announced.current = submitCount;
    const box = ref.current;
    if (!box) return;
    box.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    box.focus({ preventScroll: true });
  }, [items, submitCount, isSubmitting]);

  return (
    <div ref={ref} tabIndex={-1} className="scroll-mt-24 outline-none" data-error-summary-skip>
      {items.length > 0 && (
        <div
          role="alert"
          aria-labelledby="form-error-summary-title"
          className="flex animate-ui-enter gap-3 rounded-xl bg-red-50 p-4 text-red-950 ring-1 ring-red-200 ring-inset"
        >
          <CircleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div className="flex min-w-0 flex-col gap-2">
            <p id="form-error-summary-title" className="type-ui-label">
              {items.length === 1 ? "1 thing to fix before saving" : `${items.length} things to fix before saving`}
            </p>
            <ul className="flex flex-col gap-1.5">
              {items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => jumpTo(item.target)}
                    className="text-left type-ui-small text-red-900 underline decoration-red-300 underline-offset-4 hover:decoration-red-700 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none"
                  >
                    {item.label ? (
                      <>
                        <span className="font-medium">{item.label}:</span> {item.message}
                      </>
                    ) : (
                      item.message
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
