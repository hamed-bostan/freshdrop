import { z } from "zod";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";

/**
 * The shape the admin customer-analytics endpoint promises to return, validated at
 * the typed-service boundary (see `parseApiResponse`). Derived at read time from the
 * order history, so it has no persisted schema behind it to keep it honest — which
 * is precisely why the client checks it.
 */
export const customerOrderSummaryResponseSchema = z.object({
  userId: z.string(),
  name: z.string(),
  phone: z.string(),
  avatarUrl: z.string().nullable(),
  orderCount: z.number(),
  totalSpent: z.number(),
  lastOrderAt: z.string(),
}) satisfies z.ZodType<CustomerOrderSummary>;

export const customerOrderSummaryListResponseSchema = z.array(customerOrderSummaryResponseSchema);
