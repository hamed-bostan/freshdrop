import { z } from "zod";

/** Largest single top-up (6 digits) — mirrors the add-money keypad's digit cap. */
const MAX_FUNDS = 999_999;

/**
 * Adding money to the wallet. The server re-validates with this same schema — the
 * client is never trusted. `amount` is coerced from the keypad's string value.
 * Validation messages are `formErrors` message keys, translated at display time
 * (see `src/lib/formErrorMessage.ts`).
 */
export const addFundsSchema = z.object({
  amount: z.coerce.number().positive("amountPositive").max(MAX_FUNDS, "amountTooLarge"),
});

/**
 * Adding a saved card. The full PAN is validated here but masked before storage;
 * the CVV is validated as a present-and-well-formed value but never persisted.
 */
export const addCardSchema = z.object({
  number: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{12,19}$/, "cardNumberInvalid")),
  holderName: z.string().trim().min(1, "cardHolderRequired"),
  expiryMonth: z.string().trim().regex(/^(0?[1-9]|1[0-2])$/, "expiryMonthInvalid"),
  expiryYear: z.string().trim().regex(/^\d{2}$|^\d{4}$/, "expiryYearInvalid"),
  cvv: z.string().trim().regex(/^\d{3,4}$/, "cvvInvalid"),
});

export type AddFundsInput = z.infer<typeof addFundsSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
