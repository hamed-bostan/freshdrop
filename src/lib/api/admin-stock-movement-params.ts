import {
  STOCK_MOVEMENT_DIRECTIONS,
  STOCK_MOVEMENT_REASONS,
  type StockMovementDirection,
  type StockMovementFilters,
  type StockMovementReason,
} from "@/src/domain/entities/StockMovement";

const DIRECTION_SET = new Set<string>(STOCK_MOVEMENT_DIRECTIONS);
const REASON_SET = new Set<string>(STOCK_MOVEMENT_REASONS);

function parseInstant(value: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/** Parse and narrow the inventory ledger's URL filter contract. */
export function parseAdminStockMovementFilters(params: URLSearchParams): StockMovementFilters {
  const filters: StockMovementFilters = {};
  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const movement = params.get("movement");
  if (movement && DIRECTION_SET.has(movement)) {
    filters.direction = movement as StockMovementDirection;
  }

  const reason = params.get("reason");
  if (reason && REASON_SET.has(reason)) filters.reason = reason as StockMovementReason;

  const occurredFrom = parseInstant(params.get("from"));
  if (occurredFrom) filters.occurredFrom = occurredFrom;
  const occurredTo = parseInstant(params.get("to"));
  if (occurredTo) filters.occurredTo = occurredTo;

  return filters;
}
