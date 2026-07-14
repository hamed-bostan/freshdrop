import { z } from "zod";

/**
 * `GET /favorites/:productId` — whether the product is in the caller's favorites.
 * A predicate endpoint (no domain entity to mirror); the favorites *list* returns
 * products and is validated with `productListResponseSchema`.
 */
export const favoriteStatusResponseSchema = z.object({
  favorited: z.boolean(),
});
