import { z } from "zod";

import type { SavedCard, Wallet } from "@/src/domain/entities/Wallet";

/**
 * The shapes the wallet endpoints promise to return, validated at the typed-service
 * boundary (see `parseApiResponse`). The wallet is money on screen — a balance or a
 * transaction amount arriving as a string would render as `NaN` (or worse, as text)
 * with nothing raised, so this is the last surface that should take a body on faith.
 */
export const savedCardResponseSchema = z.object({
  id: z.string(),
  brand: z.enum(["Visa", "Mastercard"]),
  holderName: z.string(),
  /** Already masked to a display number server-side — the full PAN never leaves the server. */
  number: z.string(),
  expiry: z.string(),
}) satisfies z.ZodType<SavedCard>;

export const savedCardListResponseSchema = z.array(savedCardResponseSchema);

export const walletResponseSchema = z.object({
  balance: z.number(),
  cards: savedCardListResponseSchema,
  transactions: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      // Machine reason + item name for localization; `null` on rows predating the
      // columns, where the presentation layer falls back to `description`.
      reason: z.string().nullable(),
      reasonItem: z.string().nullable(),
      date: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    }),
  ),
}) satisfies z.ZodType<Wallet>;
