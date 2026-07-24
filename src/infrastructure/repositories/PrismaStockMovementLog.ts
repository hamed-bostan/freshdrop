import type { StockMovement, StockMovementReason } from "@/src/domain/entities/StockMovement";
import { STOCK_MOVEMENT_REASONS } from "@/src/domain/entities/StockMovement";
import type { IStockMovementLog } from "@/src/domain/repositories/IStockMovementLog";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Stock movement history backed by PostgreSQL via Prisma. Server-side only (it
 * opens a DB connection), bound through the container — never imported by client
 * code.
 *
 * Read-only: entries are written by `PrismaProductRepository`, inside the same
 * transaction as the stock change they describe. Nothing else writes this table,
 * and there is no update or delete anywhere.
 */
export class PrismaStockMovementLog implements IStockMovementLog {
  async listForProduct(productId: string, limit: number): Promise<StockMovement[]> {
    const rows = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toStockMovement);
  }

  async listRecent(limit: number): Promise<StockMovement[]> {
    const rows = await prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toStockMovement);
  }
}

/** Fall back to `correction` for a stored reason the domain doesn't know. */
const REASONS = new Set<string>(STOCK_MOVEMENT_REASONS);

/**
 * The column is a plain string (the schema is enum-free), so narrow here rather
 * than trusting the database to hold only known values. An unrecognised reason
 * reads as `correction` — the neutral one — so a row written by an older or newer
 * version of the app still renders instead of crashing the history panel.
 */
function toStockMovementReason(value: string): StockMovementReason {
  return REASONS.has(value) ? (value as StockMovementReason) : "correction";
}

/** Map a Prisma row to the domain entity, narrowing the stored reason string. */
function toStockMovement(row: {
  id: string;
  productId: string;
  delta: number;
  quantityAfter: number;
  reason: string;
  note: string | null;
  actorId: string | null;
  actorName: string | null;
  orderId: string | null;
  createdAt: Date;
}): StockMovement {
  return {
    id: row.id,
    productId: row.productId,
    delta: row.delta,
    quantityAfter: row.quantityAfter,
    reason: toStockMovementReason(row.reason),
    note: row.note ?? undefined,
    actorId: row.actorId ?? undefined,
    actorName: row.actorName ?? undefined,
    orderId: row.orderId ?? undefined,
    at: row.createdAt,
  };
}
