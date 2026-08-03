import { z } from "zod";
import {
  STOCK_MOVEMENT_DIRECTIONS,
  STOCK_MOVEMENT_REASONS,
  type StockMovementFilters,
} from "@/src/domain/entities/StockMovement";
import { instantParamSchema } from "./instant-param";
import { trimmedTextParamSchema } from "./trimmed-text-param";

export const adminStockMovementFiltersSchema = z.object({
  q: trimmedTextParamSchema,
  movement: z.enum(STOCK_MOVEMENT_DIRECTIONS).optional(),
  reason: z.enum(STOCK_MOVEMENT_REASONS).optional(),
  from: instantParamSchema,
  to: instantParamSchema,
});

/** Parse and narrow the inventory ledger's URL filter contract. Throws `ZodError` for a recognised-but-invalid value. */
export function parseAdminStockMovementFilters(params: URLSearchParams): StockMovementFilters {
  const parsed = adminStockMovementFiltersSchema.parse(Object.fromEntries(params));
  const filters: StockMovementFilters = {};

  if (parsed.q) filters.query = parsed.q;
  if (parsed.movement) filters.direction = parsed.movement;
  if (parsed.reason) filters.reason = parsed.reason;
  if (parsed.from) filters.occurredFrom = parsed.from;
  if (parsed.to) filters.occurredTo = parsed.to;

  return filters;
}
