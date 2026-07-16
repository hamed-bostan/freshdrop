import { z } from "zod";

/**
 * The body for selecting a checkout payment method, shared by the client mutation
 * and the REST route handler (defensive re-validation — never trust the client).
 * `methodId` is a catalog option id or one of the user's saved card ids; the route
 * re-checks it against the caller's actual options. The owner (userId) is taken from
 * the session server-side, so it never travels over the wire.
 */
export const selectPaymentMethodSchema = z.object({
  methodId: z.string().trim().min(1, "paymentMethodRequired"),
});

export type SelectPaymentMethodInput = z.infer<typeof selectPaymentMethodSchema>;
