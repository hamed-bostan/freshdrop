import type { Refund, RefundKind, RefundLine } from "@/src/domain/entities/Refund";
import type { IRefundRepository, NewRefund } from "@/src/domain/repositories/IRefundRepository";
import { prisma } from "@/src/infrastructure/prisma/client";
import type { PrismaDb } from "@/src/infrastructure/prisma/transaction";

/**
 * The refund ledger, backed by PostgreSQL via Prisma. Server-side only — bound
 * through the container, never imported by client code.
 *
 * No `update`, no `delete`, and `record` is a single insert (refund + lines) that
 * changes nothing else — no transaction of its own. It still takes a `PrismaDb`
 * so phase 5's writers can hand it the same transaction client their `uow.run`
 * callback already has, and have the refund row commit with the order/wallet
 * writes it accompanies.
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

  async record(refund: NewRefund): Promise<Refund> {
    const row = await this.db.refund.create({
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
    return toRefund(row);
  }
}

type RefundRow = {
  id: string;
  orderId: string;
  userId: string;
  kind: string;
  amount: number;
  taxAmount: number;
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
  amount: number;
  taxAmount: number;
};

function toRefund(row: RefundRow): Refund {
  return {
    id: row.id,
    orderId: row.orderId,
    userId: row.userId,
    kind: row.kind as RefundKind,
    amount: row.amount,
    taxAmount: row.taxAmount,
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
    amount: row.amount,
    taxAmount: row.taxAmount,
  };
}
