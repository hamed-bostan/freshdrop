import { z } from "zod";

/**
 * The single source of truth for category form input, shared by the client form
 * (React Hook Form resolver) and the REST route handlers (defensive re-validation
 * — never trust the client). Framework-free, so it stays importable from both.
 */
export const categoryFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(50, "Name is too long."),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .max(60, "Slug is too long.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
    iconUrl: z.string().min(1, "An icon image is required.").url("Upload a valid image."),
    // Optional Persian (fa) name override; blank means "no fa translation".
    faName: z
      .string()
      .trim()
      .transform((value) => (value.length > 0 ? value : undefined)),
  })
  .transform(({ faName, ...base }) => ({
    ...base,
    translations: faName ? [{ locale: "fa", name: faName }] : [],
  }));

/** Form value shape (what the controls hold, before transform). */
export type CategoryFormInput = z.input<typeof categoryFormSchema>;
/** Validated payload shape (what the use-case receives) — matches `NewCategory`. */
export type CategoryFormValues = z.output<typeof categoryFormSchema>;
