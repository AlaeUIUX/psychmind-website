import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

// Minimal Zod 4 resolver for react-hook-form (instead of @hookform/resolvers,
// whose optional peers still pin Zod 3). Maps each issue to its field path;
// the first message per field wins.
export function zodResolver<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
): Resolver<z.input<S>, unknown, z.output<S>> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.length ? issue.path.map(String) : ["root"];
      let node = errors;
      path.forEach((key, i) => {
        if (i === path.length - 1) {
          node[key] ??= { type: issue.code, message: issue.message };
        } else {
          node[key] ??= {};
          node = node[key] as Record<string, unknown>;
        }
      });
    }
    return { values: {}, errors: errors as FieldErrors<z.input<S>> };
  };
}
