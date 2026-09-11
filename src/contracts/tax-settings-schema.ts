import { z } from "zod";

const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * The body for saving the store's VAT rate, shared by the dashboard settings
 * form and the REST route handler (defensive re-validation — never trust the
 * client). `ratePercent` is authored as a string (what the number input
 * emits) and transformed to a 0–100 number on parse.
 */
export const taxSettingsFormSchema = z.object({
  ratePercent: z
    .string()
    .trim()
    .min(1, "rateRequired")
    .regex(RATE_PATTERN, "rateInvalid")
    .transform(Number)
    .refine((n) => n >= 0 && n <= 100, "rateRange"),
  enabled: z.boolean().default(false),
});

export type TaxSettingsFormInput = z.input<typeof taxSettingsFormSchema>;
export type TaxSettingsFormValues = z.output<typeof taxSettingsFormSchema>;
