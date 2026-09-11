import { z } from "zod";

import { DELIVERY_ISSUE_STATUSES, DELIVERY_ISSUE_TYPES } from "@/src/domain/entities/DeliveryIssue";

/**
 * Shared by the dashboard's "report an issue" form and the admin REST route
 * (defensive re-validation — never trust the client). Framework-free.
 */
export const createDeliveryIssueSchema = z.object({
  type: z.enum(DELIVERY_ISSUE_TYPES),
  delayMinutes: z.coerce.number().int("delayWholeNumber").min(0, "delayNonNegative"),
});
export type CreateDeliveryIssueInput = z.infer<typeof createDeliveryIssueSchema>;

/** Shared by the Issues & incidents status control and its PATCH route. */
export const updateDeliveryIssueStatusSchema = z.object({
  status: z.enum(DELIVERY_ISSUE_STATUSES),
});
export type UpdateDeliveryIssueStatusInput = z.infer<typeof updateDeliveryIssueStatusSchema>;

/** What every delivery-issue endpoint returns the issue as. */
export const deliveryIssueResponseSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.number().int().nonnegative(),
  zone: z.string(),
  type: z.enum(DELIVERY_ISSUE_TYPES),
  status: z.enum(DELIVERY_ISSUE_STATUSES),
  driverId: z.string().nullable(),
  driverName: z.string().nullable(),
  delayMinutes: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const deliveryIssueListResponseSchema = z.array(deliveryIssueResponseSchema);
