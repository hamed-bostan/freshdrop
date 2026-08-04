import type { Prisma } from "@prisma/client";
import type {
  ReturnItem,
  ReturnItemCondition,
  ReturnRecoveryDecision,
  ReturnRequest,
  ReturnRequestStatus,
} from "@/src/domain/entities/Return";
import type {
  IReturnRepository,
  NewReturnRequest,
  ReturnItemInspection,
} from "@/src/domain/repositories/IReturnRepository";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";
import { recordAudit } from "./writeActivityEntry";

/**
 * The return/RMA ledger, backed by PostgreSQL via Prisma. Server-side only —
 * bound through the container, never imported by client code.
 *
 * `create`/`recordInspection`/`resolve` all take a `PrismaDb` so a caller inside
 * a unit of work (`ResolveOrderReturn.approve`, `RequestOrderReturn`) can hand
 * them the same transaction client, and have the return row commit with the
 * order/wallet writes it accompanies — the same arrangement `PrismaRefundRepository`
 * uses.
 */
export class PrismaReturnRepository implements IReturnRepository {
  constructor(private readonly db: PrismaDb = prisma) {}

  async getForOrder(orderId: string): Promise<ReturnRequest | null> {
    const row = await this.db.returnRequest.findFirst({
      where: { orderId },
      include: { items: true },
      orderBy: { requestedAt: "desc" },
    });
    return row ? toReturnRequest(row) : null;
  }

  async create(request: NewReturnRequest, audit?: AuditHook<ReturnRequest>): Promise<ReturnRequest> {
    return inTransaction(this.db, async (tx) => {
      const row = await tx.returnRequest.create({
        data: {
          orderId: request.orderId,
          userId: request.userId,
          reason: request.reason,
          actorId: request.actorId,
          actorName: request.actorName,
          items: {
            create: request.items.map((item) => ({
              orderItemId: item.orderItemId,
              productId: item.productId,
              quantity: item.quantity,
              refundAmount: item.refundAmount,
              taxAmount: item.taxAmount,
            })),
          },
        },
        include: { items: true },
      });
      const saved = toReturnRequest(row);
      await recordAudit(tx, saved, audit);
      return saved;
    });
  }

  async recordInspection(
    returnRequestId: string,
    items: readonly ReturnItemInspection[],
    audit?: AuditHook<ReturnRequest>,
  ): Promise<ReturnRequest> {
    return inTransaction(this.db, async (tx) => {
      for (const item of items) {
        await tx.returnItem.update({
          where: { id: item.returnItemId },
          data: { condition: item.condition, recoveryDecision: item.recoveryDecision },
        });
      }
      const row = await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { status: "inspected", inspectedAt: new Date() },
        include: { items: true },
      });
      const saved = toReturnRequest(row);
      await recordAudit(tx, saved, audit);
      return saved;
    });
  }

  async resolve(
    returnRequestId: string,
    status: "resolved" | "rejected",
    audit?: AuditHook<ReturnRequest>,
  ): Promise<ReturnRequest> {
    return inTransaction(this.db, async (tx) => {
      const row = await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { status, resolvedAt: new Date() },
        include: { items: true },
      });
      const saved = toReturnRequest(row);
      await recordAudit(tx, saved, audit);
      return saved;
    });
  }
}

type ReturnRequestRow = {
  id: string;
  rmaNumber: number;
  orderId: string;
  userId: string;
  status: string;
  reason: string | null;
  requestedAt: Date;
  receivedAt: Date | null;
  inspectedAt: Date | null;
  resolvedAt: Date | null;
  actorId: string | null;
  actorName: string | null;
  items: ReturnItemRow[];
};

type ReturnItemRow = {
  id: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  condition: string | null;
  recoveryDecision: string | null;
  refundAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
};

function toReturnRequest(row: ReturnRequestRow): ReturnRequest {
  return {
    id: row.id,
    rmaNumber: row.rmaNumber,
    orderId: row.orderId,
    userId: row.userId,
    status: row.status as ReturnRequestStatus,
    reason: row.reason ?? undefined,
    requestedAt: row.requestedAt.toISOString(),
    receivedAt: row.receivedAt?.toISOString(),
    inspectedAt: row.inspectedAt?.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
    actorId: row.actorId ?? undefined,
    actorName: row.actorName ?? undefined,
    items: row.items.map(toReturnItem),
  };
}

function toReturnItem(row: ReturnItemRow): ReturnItem {
  return {
    id: row.id,
    orderItemId: row.orderItemId,
    productId: row.productId,
    quantity: row.quantity,
    condition: (row.condition as ReturnItemCondition | null) ?? undefined,
    recoveryDecision: (row.recoveryDecision as ReturnRecoveryDecision | null) ?? undefined,
    refundAmount: row.refundAmount.toNumber(),
    taxAmount: row.taxAmount.toNumber(),
  };
}
