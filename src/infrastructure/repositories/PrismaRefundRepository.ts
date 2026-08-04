import type { Prisma } from "@prisma/client";
import type { Refund, RefundKind, RefundLine } from "@/src/domain/entities/Refund";
import type { IRefundRepository, NewRefund } from "@/src/domain/repositories/IRefundRepository";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";
import { recordAudit } from "./writeActivityEntry";

/**
 * The refund ledger, backed by PostgreSQL via Prisma. Server-side only — bound
 * through the container, never imported by client code.
 *
 * No `update`, no `delete`. `record` still takes a `PrismaDb` so phase 5's dual-
 * write flows can hand it the same transaction client their `uow.run` callback
 * already has, and have the refund row commit with the order/wallet writes it
 * accompanies; `inTransaction` joins that transaction rather than opening a
 * second one, the same arrangement `PrismaOrderRepository` uses for its own
 * audit hook.
 */
export class PrismaRefundRepository implements IRefundRepository {
  constructor(private readonly db: PrismaDb = prisma) {}

  async listForOrder(orderId: string): Promise<Refund[]> {
    const rows = await this.db.refund.findMany({
      where: { orderId },
      include: { lines: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toRefund);
  }

  async record(refund: NewRefund, audit?: AuditHook<Refund>): Promise<Refund> {
    return inTransaction(this.db, async (tx) => {
      const row = await tx.refund.create({
        data: {
          orderId: refund.orderId,
          userId: refund.userId,
          kind: refund.kind,
          amount: refund.amount,
          taxAmount: refund.taxAmount,
          reason: refund.reason,
          actorId: refund.actorId,
          actorName: refund.actorName,
          lines: {
            create: refund.lines.map((line) => ({
              orderItemId: line.orderItemId,
              productId: line.productId,
              quantity: line.quantity,
              amount: line.amount,
              taxAmount: line.taxAmount,
            })),
          },
        },
        include: { lines: true },
      });
      const saved = toRefund(row);
      await recordAudit(tx, saved, audit);
      return saved;
    });
  }
}

/** Shared with `PrismaOrderRepository`, which attaches the same rows to `Order.refunds`. */
export type RefundRow = {
  id: string;
  orderId: string;
  userId: string;
  kind: string;
  amount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  reason: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: Date;
  lines: RefundLineRow[];
};

type RefundLineRow = {
  orderItemId: string;
  productId: string;
  quantity: number | null;
  amount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
};

export function toRefund(row: RefundRow): Refund {
  return {
    id: row.id,
    orderId: row.orderId,
    userId: row.userId,
    kind: row.kind as RefundKind,
    amount: row.amount.toNumber(),
    taxAmount: row.taxAmount.toNumber(),
    reason: row.reason ?? undefined,
    actorId: row.actorId ?? undefined,
    actorName: row.actorName ?? undefined,
    createdAt: row.createdAt.toISOString(),
    lines: row.lines.map(toRefundLine),
  };
}

function toRefundLine(row: RefundLineRow): RefundLine {
  return {
    orderItemId: row.orderItemId,
    productId: row.productId,
    quantity: row.quantity ?? undefined,
    amount: row.amount.toNumber(),
    taxAmount: row.taxAmount.toNumber(),
  };
}
