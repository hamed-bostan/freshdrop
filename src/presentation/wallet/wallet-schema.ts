import { z } from "zod";

/** Largest single top-up (6 digits) — mirrors the add-money keypad's digit cap. */
const MAX_FUNDS = 999_999;

/**
 * Adding money to the wallet. The server re-validates with this same schema — the
 * client is never trusted. `amount` is coerced from the keypad's string value.
 */
export const addFundsSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero.").max(MAX_FUNDS, "That amount is too large."),
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
    .pipe(z.string().regex(/^\d{12,19}$/, "Enter a valid card number.")),
  holderName: z.string().trim().min(1, "Cardholder name is required."),
  expiryMonth: z.string().trim().regex(/^(0?[1-9]|1[0-2])$/, "Enter a month between 1 and 12."),
  expiryYear: z.string().trim().regex(/^\d{2}$|^\d{4}$/, "Enter a valid expiry year."),
  cvv: z.string().trim().regex(/^\d{3,4}$/, "Enter a valid CVV."),
});

export type AddFundsInput = z.infer<typeof addFundsSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
