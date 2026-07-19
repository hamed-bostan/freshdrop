import { z } from "zod";
import { STOCK_MOVEMENT_REASONS } from "@/src/domain/entities/StockMovement";

/**
 * What `GET /api/products/:id/stock` promises, validated at the typed-service
 * boundary (see `parseApiResponse`). Frontend-only, so it lives beside the feature
 * rather than in `src/contracts/` — nothing on the route-handler side parses it.
 *
 * `at` is a string here, not a `Date`: the entity's timestamp crosses the wire as
 * an ISO string, and the history panel formats it as one. Describing it as a
 * `Date` would be describing the domain type, not the response.
 */
export const stockMovementResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  delta: z.number(),
  quantityAfter: z.number(),
  reason: z.enum(STOCK_MOVEMENT_REASONS),
  note: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  orderId: z.string().optional(),
  at: z.string(),
});

/** One movement as the dashboard receives it. */
export type StockMovementEntry = z.infer<typeof stockMovementResponseSchema>;

export const stockMovementListResponseSchema = z.array(stockMovementResponseSchema);
