import { z } from "zod";
import type { AdminOrderFilters } from "@/src/domain/entities/AdminOrderFilters";
import { DELIVERY_TYPES, PAYMENT_STATUSES } from "@/src/domain/entities/Order";
import { ORDER_PIPELINE_STAGES } from "@/src/domain/entities/OrderPipelineStage";
import { parseInstant } from "./instant-param";

/**
 * The wire contract for the admin order list's filters — shared by the dashboard
 * toolbar and the admin route, like `admin-product-params.ts`.
 *
 * Query-param names: `q`, `pipeline`, `delivery`, `payment`, `from`/`to` and
 * `min`/`max`. Paging and ordering ride in the same query string but are parsed
 * by `pagination-params.ts`.
 *
 * Every value is validated against the domain's own vocabulary and anything else
 * is dropped rather than rejected: these params come from links and a
 * hand-editable URL bar, so a stale bookmark should degrade to a wider list, not
 * a 400. The narrowing is what has to be trustworthy, not the input.
 */

const pipelineSchema = z.enum(ORDER_PIPELINE_STAGES).optional().catch(undefined);
const deliverySchema = z.enum(DELIVERY_TYPES).optional().catch(undefined);
const paymentSchema = z.enum(PAYMENT_STATUSES).optional().catch(undefined);
const amountSchema = z
  .preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.coerce.number().finite().nonnegative())
  .optional()
  .catch(undefined);

/**
 * A finite, non-negative money bound, or `undefined`.
 *
 * `Number("")` is 0, which would silently turn a cleared Min field into "at
 * least zero" — harmless here but the same trap that makes an empty Max mean
 * "at most nothing", so both are handled by rejecting a blank outright.
 */
function parseAmount(value: string | null): number | undefined {
  return amountSchema.parse(value ?? undefined);
}

export function parseAdminOrderFilters(params: URLSearchParams): AdminOrderFilters {
  const filters: AdminOrderFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const pipeline = pipelineSchema.parse(params.get("pipeline") ?? undefined);
  if (pipeline) filters.pipeline = pipeline;

  const delivery = deliverySchema.parse(params.get("delivery") ?? undefined);
  if (delivery) filters.deliveryType = delivery;

  const payment = paymentSchema.parse(params.get("payment") ?? undefined);
  if (payment) filters.paymentStatus = payment;

  const placedFrom = parseInstant(params.get("from"));
  if (placedFrom) filters.placedFrom = placedFrom;
  const placedTo = parseInstant(params.get("to"));
  if (placedTo) filters.placedTo = placedTo;

  const minTotal = parseAmount(params.get("min"));
  if (minTotal != null) filters.minTotal = minTotal;
  const maxTotal = parseAmount(params.get("max"));
  if (maxTotal != null) filters.maxTotal = maxTotal;

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
