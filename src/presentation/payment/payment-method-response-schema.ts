import { z } from "zod";

import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";

/**
 * The shapes the payment-method endpoints promise to return, validated at the
 * typed-service boundary (see `parseApiResponse`).
 */
export const paymentMethodResponseSchema = z.object({
  id: z.string(),
  label: z.string(),
  group: z.enum(["cash", "wallet", "card", "options"]),
}) satisfies z.ZodType<PaymentMethod>;

export const paymentMethodListResponseSchema = z.array(paymentMethodResponseSchema);

/**
 * `GET /payment-methods/selected` — the caller's chosen checkout method, `null`
 * when they haven't picked one yet.
 */
export const selectedPaymentMethodResponseSchema = z.object({
  selectedId: z.string().nullable(),
});

/** `PUT /payment-methods/selected` — echoes back the id that was stored (never `null`). */
export const storedPaymentMethodResponseSchema = z.object({
  selectedId: z.string(),
});
