import { z } from "zod";
import type { AdminOrderFilters } from "@/src/domain/entities/AdminOrderFilters";
import { DELIVERY_TYPES, PAYMENT_STATUSES } from "@/src/domain/entities/Order";
import { ORDER_PIPELINE_STAGES } from "@/src/domain/entities/OrderPipelineStage";
import { instantParamSchema } from "./instant-param";
import { trimmedTextParamSchema } from "./trimmed-text-param";

/**
 * The wire contract for the admin order list's filters — shared by the dashboard
 * toolbar and the admin route, like `admin-product-params.ts`.
 *
 * Query-param names: `q`, `pipeline`, `delivery`, `payment`, `from`/`to` and
 * `min`/`max`. Paging and ordering ride in the same query string but are parsed
 * by `pagination-params.ts`.
 *
 * `pipeline`/`delivery`/`payment` are validated against the domain's own
 * vocabulary and `from`/`to`/`min`/`max` against their shape; a recognised-but-
 * invalid value fails validation (see `parseAdminOrderFilters`). Only free text
 * (`q`) and an absent field are forgiven — the toolbar's own controls can't
 * produce anything else, so a rejected request is a hand-edited or
 * out-of-contract one, not a stale link degrading gracefully.
 */

/**
 * A finite, non-negative money bound, or `undefined`.
 *
 * `Number("")` is 0, which would silently turn a cleared Min field into "at
 * least zero" — harmless here but the same trap that makes an empty Max mean
 * "at most nothing", so both are handled by treating a blank as absent rather
 * than as zero.
 */
const amountParamSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().finite().nonnegative().optional(),
);

export const adminOrderFiltersSchema = z.object({
  q: trimmedTextParamSchema,
  pipeline: z.enum(ORDER_PIPELINE_STAGES).optional(),
  delivery: z.enum(DELIVERY_TYPES).optional(),
  payment: z.enum(PAYMENT_STATUSES).optional(),
  from: instantParamSchema,
  to: instantParamSchema,
  min: amountParamSchema,
  max: amountParamSchema,
});

/** Parse order-list filters from a `URLSearchParams`. Throws `ZodError` for a recognised-but-invalid value. */
export function parseAdminOrderFilters(params: URLSearchParams): AdminOrderFilters {
  const parsed = adminOrderFiltersSchema.parse(Object.fromEntries(params));
  const filters: AdminOrderFilters = {};

  if (parsed.q) filters.query = parsed.q;
  if (parsed.pipeline) filters.pipeline = parsed.pipeline;
  if (parsed.delivery) filters.deliveryType = parsed.delivery;
  if (parsed.payment) filters.paymentStatus = parsed.payment;
  if (parsed.from) filters.placedFrom = parsed.from;
  if (parsed.to) filters.placedTo = parsed.to;
  if (parsed.min != null) filters.minTotal = parsed.min;
  if (parsed.max != null) filters.maxTotal = parsed.max;

  return filters;
}

export function buildAdminOrderParams(filters: AdminOrderFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.pipeline) params.set("pipeline", filters.pipeline);
  if (filters.deliveryType) params.set("delivery", filters.deliveryType);
  if (filters.paymentStatus) params.set("payment", filters.paymentStatus);
  if (filters.placedFrom) params.set("from", filters.placedFrom);
  if (filters.placedTo) params.set("to", filters.placedTo);
  if (filters.minTotal != null) params.set("min", String(filters.minTotal));
  if (filters.maxTotal != null) params.set("max", String(filters.maxTotal));
  return params;
}
