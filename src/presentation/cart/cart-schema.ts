import { z } from "zod";

/** Upper bound for a single line's quantity (mirrors the cart UI's stepper cap). */
const MAX_QUANTITY = 99;

/**
 * Adding to the cart. The server re-validates with this same schema — the client
 * is never trusted. `quantity` defaults to one item.
 */
export const addToCartSchema = z.object({
  productId: z.string().trim().min(1, "A product is required."),
  quantity: z.coerce.number().int().positive().max(MAX_QUANTITY).default(1),
});

/** Setting a cart line to an absolute quantity. */
export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive().max(MAX_QUANTITY),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
