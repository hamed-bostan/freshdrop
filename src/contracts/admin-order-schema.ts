import { z } from "zod";

/**
 * What an admin submits to place an order for a customer — shared by the create
 * form and `POST /api/admin/orders`, so the form's rules and the server's are one
 * set of rules rather than two that agree today.
 *
 * Carries **no amounts**. Product ids and quantities only: the use-case prices the
 * order from the catalog, so there is no field here in which a total could be
 * asserted. That is a shape decision, not a validation one — a schema with a
 * `total` would need a rule saying "but ignore it", and rules like that get
 * dropped.
 */
export const adminOrderLineSchema = z.object({
  productId: z.string().min(1, "productRequired"),
  quantity: z.number().int("amountWhole").min(1, "amountPositive"),
});

export const adminOrderSchema = z.object({
  /** The customer the order is for; they must already exist. */
  userId: z.string().min(1, "customerRequired"),
  lines: z.array(adminOrderLineSchema).min(1, "linesRequired").max(50, "linesTooMany"),
  location: z.string().min(1, "addressRequired").max(300, "addressTooLong"),
  /** Delivery calendar date, `YYYY-MM-DD` — re-checked against the bookable horizon server-side. */
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateInvalid"),
  deliveryWindowId: z.string().min(1, "slotRequired"),
  deliveryType: z.enum(["delivery", "pickup"]),
  /**
   * Deliberately excludes `refunded`: that is an outcome of the return flow, not a
   * state an order can be *born* in, and offering it here would be a way to record
   * a refund that never happened.
   */
  paymentStatus: z.enum(["paid", "pending", "failed"]),
});

export type AdminOrderInput = z.infer<typeof adminOrderSchema>;
