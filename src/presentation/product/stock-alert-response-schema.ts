import { z } from "zod";

/**
 * `GET /products/:id/stock-alert` — whether the caller is subscribed to a
 * product's back-in-stock alert. A predicate endpoint rather than an entity, so
 * the schema stands alone (there's no domain type to mirror), but it is validated
 * like any other body: a truthy string sneaking through as `subscribed` would
 * silently flip the UI.
 */
export const stockAlertStatusResponseSchema = z.object({
  subscribed: z.boolean(),
});
