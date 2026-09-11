import { z } from "zod";

/**
 * The single source of truth for placing an order, shared by the checkout form and
 * the REST route handler (defensive re-validation — never trust the client). Only
 * the *selections* travel over the wire: the server reads the cart and recomputes
 * the totals itself, so item prices can't be tampered with. `promo` is forwarded
 * so the server's totals match the discount the user saw at checkout.
 */
export const placeOrderSchema = z.object({
  addressId: z.string().trim().min(1, "addressRequired"),
  // The booked delivery slot: a calendar date (YYYY-MM-DD) + a window slug. The
  // server re-resolves the window and enforces its capacity — it never trusts the
  // client's view of availability.
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "slotRequired"),
  deliveryWindowId: z.string().trim().min(1, "slotRequired"),
  promo: z.string().trim().min(1).optional(),
  // Per-line out-of-stock pre-approval (grocery substitutions). Only the choices
  // travel; the server matches them to the cart it recomputes and defaults any
  // unlisted line to "substitute". Optional so older clients still place orders.
  substitutions: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        preference: z.enum(["substitute", "refund", "contact"]),
      }),
    )
    .optional(),
  // Free-text note for the courier — optional, capped to match the checkout
  // form's own character counter.
  deliveryInstructions: z.string().trim().max(150).optional(),
  // How much of the order total to pay from the wallet balance. The server still
  // re-validates it against the recomputed cart total and the actual balance —
  // this only bounds the shape of what a caller may propose.
  walletApplied: z.number().min(0).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
