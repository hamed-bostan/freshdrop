import { z } from "zod";

import type { ReturnRequest } from "@/src/domain/entities/Return";
import {
  RETURN_ITEM_CONDITIONS,
  RETURN_RECOVERY_DECISIONS,
  RETURN_REQUEST_STATUSES,
} from "@/src/domain/entities/Return";

/**
 * What `GET /api/orders/:id/return` promises — the order's most recent return
 * request, or `null` if it has never had one. Admin-only read, so this stays
 * colocated with the dashboard rather than the shared order response contract.
 */
const returnItemResponseSchema = z.object({
  id: z.string(),
  orderItemId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  condition: z.enum(RETURN_ITEM_CONDITIONS).optional(),
  recoveryDecision: z.enum(RETURN_RECOVERY_DECISIONS).optional(),
  refundAmount: z.number(),
  taxAmount: z.number(),
});

export const returnRequestResponseSchema = z.object({
  id: z.string(),
  rmaNumber: z.number().int().positive(),
  orderId: z.string(),
  userId: z.string(),
  status: z.enum(RETURN_REQUEST_STATUSES),
  reason: z.string().optional(),
  requestedAt: z.string(),
  receivedAt: z.string().optional(),
  inspectedAt: z.string().optional(),
  resolvedAt: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  items: z.array(returnItemResponseSchema),
}) satisfies z.ZodType<ReturnRequest>;

export const returnRequestOrNullResponseSchema = returnRequestResponseSchema.nullable();
