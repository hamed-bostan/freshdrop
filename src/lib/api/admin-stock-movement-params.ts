import { z } from "zod";
import {
  STOCK_MOVEMENT_DIRECTIONS,
  STOCK_MOVEMENT_REASONS,
  type StockMovementFilters,
} from "@/src/domain/entities/StockMovement";
import { parseInstant } from "./instant-param";

const directionSchema = z.enum(STOCK_MOVEMENT_DIRECTIONS).optional().catch(undefined);
const reasonSchema = z.enum(STOCK_MOVEMENT_REASONS).optional().catch(undefined);

/** Parse and narrow the inventory ledger's URL filter contract. */
export function parseAdminStockMovementFilters(params: URLSearchParams): StockMovementFilters {
  const filters: StockMovementFilters = {};
  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const movement = directionSchema.parse(params.get("movement") ?? undefined);
  if (movement) filters.direction = movement;

  const reason = reasonSchema.parse(params.get("reason") ?? undefined);
  if (reason) filters.reason = reason;

  const occurredFrom = parseInstant(params.get("from"));
  if (occurredFrom) filters.occurredFrom = occurredFrom;
  const occurredTo = parseInstant(params.get("to"));
  if (occurredTo) filters.occurredTo = occurredTo;

  return filters;
}
