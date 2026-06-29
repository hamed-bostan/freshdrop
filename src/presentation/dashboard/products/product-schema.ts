import { z } from "zod";

/**
 * The single source of truth for product form input, shared by the client form
 * (React Hook Form resolver) and the REST route handlers (defensive re-validation
 * — never trust the client). Framework-free, so it stays importable from both.
 *
 * Numeric and optional-text fields are authored as strings (that's what the form
 * controls emit) and transformed to the domain shape on parse, so the schema's
 * *output* matches `NewProduct`: `z.input` is the form's value type, `z.output`
 * the validated payload the use-case receives.
 */

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Required price: a string the form emits, validated and coerced to a positive number. */
const priceField = z
  .string()
  .trim()
  .min(1, "Enter a price.")
  .regex(PRICE_PATTERN, "Enter a valid price.")
  .transform(Number)
  .refine((n) => n > 0, "Price must be greater than 0.");

/** Optional price: blank → `undefined`; otherwise the same rules as `priceField`. */
const optionalPriceField = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .refine((value) => value === undefined || PRICE_PATTERN.test(value), "Enter a valid price.")
  .transform((value) => (value === undefined ? undefined : Number(value)));

/** Optional free text: trimmed, blank → `undefined` so it isn't stored as "". */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined));

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
    categoryId: z.string().min(1, "Choose a category."),
    price: priceField,
    originalPrice: optionalPriceField,
    imageUrl: z.string().min(1, "A product image is required.").url("Upload a valid image."),
    isFeatured: z.boolean(),
    badge: optionalText,
    unit: optionalText,
    description: optionalText,
    nutrition: optionalText,
    origin: optionalText,
  })
  .refine((data) => data.originalPrice === undefined || data.originalPrice > data.price, {
    path: ["originalPrice"],
    message: "Original price must be higher than the price.",
  });

/** Form value shape (what the controls hold). */
export type ProductFormInput = z.input<typeof productFormSchema>;
/** Validated payload shape (what the use-case receives) — matches `NewProduct`. */
export type ProductFormValues = z.output<typeof productFormSchema>;
