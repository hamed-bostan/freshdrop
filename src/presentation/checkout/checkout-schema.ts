import { z } from "zod";

/**
 * The single source of truth for placing an order, shared by the checkout form and
 * the REST route handler (defensive re-validation — never trust the client). Only
 * the *selections* travel over the wire: the server reads the cart and recomputes
 * the totals itself, so item prices can't be tampered with. `promo` is forwarded
 * so the server's totals match the discount the user saw at checkout.
 */
export const placeOrderSchema = z.object({
  addressId: z.string().trim().min(1, "Select a delivery address."),
  promo: z.string().trim().min(1).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
