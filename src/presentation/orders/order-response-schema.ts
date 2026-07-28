import { z } from "zod";
import type { Order } from "@/src/domain/entities/Order";
import type { ReorderItemsResult } from "@/src/domain/use-cases/orders/ReorderItems";

/**
 * The shape an order endpoint promises to return, validated at the typed-service
 * boundary (see `parseApiResponse`). The canonical order response contract: the
 * storefront's own-orders reads, checkout's placed order, the customer mutations
 * (cancel, return) and the dashboard's cross-user admin reads all go through it.
 *
 * Distinct from `checkout-schema.ts` and the dashboard's order input schemas, which
 * describe what a caller may *submit*. An order carries far more back than any of
 * them sends — the timestamps, the captured price breakdown, the picker's
 * substitution outcomes — which is exactly the drift worth catching.
 *
 * The wire timestamps (`placedAt`, `deliveryDate`) are ISO strings in the entity
 * too, so nothing is coerced to `Date` here; the presentation layer formats them.
 */
const substitutionResponseSchema = z.object({
  status: z.enum(["substituted", "refunded"]),
  replacement: z
    .object({
      productId: z.string(),
      name: z.string(),
      imageUrl: z.string(),
    })
    .optional(),
  refundAmount: z.number(),
});

const orderItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  quantity: z.number(),
  price: z.number(),
  substitutionPreference: z.enum(["substitute", "refund", "contact"]),
  substitution: substitutionResponseSchema.optional(),
  taxExempt: z.boolean(),
  taxAmount: z.number().nullable(),
});

const refundLineResponseSchema = z.object({
  orderItemId: z.string(),
  productId: z.string(),
  quantity: z.number().optional(),
  amount: z.number(),
  taxAmount: z.number(),
});

/** One row of the order's refund ledger (phase 4/6) — see `Refund.ts`. */
const refundResponseSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  userId: z.string(),
  kind: z.enum(["cancellation", "return", "substitution", "manual"]),
  amount: z.number(),
  taxAmount: z.number(),
  reason: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  createdAt: z.string(),
  lines: z.array(refundLineResponseSchema),
});

export const orderResponseSchema = z.object({
  id: z.string(),
  orderNumber: z.number().int().positive(),
  userId: z.string(),
  status: z.enum(["completed", "processing", "cancelled", "return_requested", "refunded"]),
  phase: z.enum(["current", "previous"]),
  deliveryType: z.enum(["delivery", "pickup"]),
  paymentStatus: z.enum(["paid", "pending", "failed", "refunded"]),
  placedAt: z.string(),
  location: z.string(),
  locationLabel: z.string().optional(),
  // The address coordinate snapshotted at checkout. Absent from legacy orders and
  // from addresses saved without one. Range-checked (WGS 84) rather than merely
  // typed, mirroring the domain's `isValidGeoPoint` — a bad coordinate doesn't
  // throw downstream, it just puts a map marker in the sea.
  destination: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  items: z.array(orderItemResponseSchema),
  subtotal: z.number(),
  shipping: z.number(),
  discount: z.number(),
  total: z.number(),
  taxAmount: z.number().nullable(),
  taxRate: z.number().nullable(),
  stage: z.enum(["confirmed", "shipped", "arrived"]).optional(),
  deliveryDate: z.string().optional(),
  deliveryWindowId: z.string().optional(),
  deliveryWindow: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  walletApplied: z.number(),
  refunds: z.array(refundResponseSchema),
}) satisfies z.ZodType<Order>;

export const orderListResponseSchema = z.array(orderResponseSchema);

/**
 * `POST /orders/:id/reorder` — how many of a past order's lines made it back into
 * the cart. A use-case result rather than an entity, but it's still a response body
 * the UI reports to the shopper ("3 items added, 1 unavailable"), so it's held to
 * the same contract.
 */
export const reorderResultResponseSchema = z.object({
  added: z.number(),
  skipped: z.number(),
}) satisfies z.ZodType<ReorderItemsResult>;
