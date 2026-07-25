import { z } from "zod";
import type { Cart } from "@/src/domain/entities/Cart";
import { productResponseSchema } from "@/src/presentation/product/product-response-schema";

/**
 * The shape the cart endpoint promises to return, validated at the typed-service
 * boundary (see `parseApiResponse`). Each line embeds the full product, so this
 * composes the catalog's `productResponseSchema` rather than restating it.
 *
 * Worth validating even though the cart is our own endpoint: the totals are
 * server-authoritative and the optimistic client store reconciles against them, so
 * a body that arrived truncated would otherwise be reconciled *into* the UI.
 */
export const cartResponseSchema = z.object({
  items: z.array(
    z.object({
      product: productResponseSchema,
      quantity: z.number(),
    }),
  ),
  subtotal: z.number(),
  shipping: z.number(),
  discount: z.number(),
  total: z.number(),
  itemCount: z.number(),
  taxAmount: z.number().nullable(),
  taxRate: z.number().nullable(),
}) satisfies z.ZodType<Cart>;
