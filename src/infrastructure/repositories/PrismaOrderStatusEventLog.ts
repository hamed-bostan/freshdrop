import type { OrderStatus } from "@/src/domain/entities/Order";
import type { OrderStatusEvent } from "@/src/domain/entities/OrderStatusEvent";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import type { IOrderStatusEventLog, NewOrderStatusEvent } from "@/src/domain/repositories/IOrderStatusEventLog";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";

/**
 * The order status event ledger, backed by PostgreSQL via Prisma. Server-side
 * only — bound through the container, never imported by client code.
 *
 * No `update`, no `delete`. `record` still takes a `PrismaDb` so
 * `PrismaOrderRepository` can hand it the same transaction client its
 * `transitionStatus`/`setTrackingStage` already opened, and have the event
 * commit with the order write it accompanies — the same arrangement
 * `PrismaRefundRepository` uses for the refund ledger.
 */
export class PrismaOrderStatusEventLog implements IOrderStatusEventLog {
  constructor(private readonly db: PrismaDb = prisma) {}

  async listForOrder(orderId: string): Promise<OrderStatusEvent[]> {
    const rows = await this.db.orderStatusEvent.findMany({
      where: { orderId },
      orderBy: { occurredAt: "asc" },
    });
    return rows.map(toOrderStatusEvent);
  }

  async record(event: NewOrderStatusEvent): Promise<OrderStatusEvent> {
    return inTransaction(this.db, async (tx) => {
      const row = await tx.orderStatusEvent.create({
        data: {
          orderId: event.orderId,
          fromStatus: event.fromStatus ?? null,
          toStatus: event.toStatus,
          fromStage: event.fromStage ?? null,
          toStage: event.toStage ?? null,
          actorId: event.actorId ?? null,
          actorName: event.actorName ?? null,
          reason: event.reason ?? null,
          occurredAt: new Date(event.occurredAt),
        },
      });
      return toOrderStatusEvent(row);
    });
  }
}

type OrderStatusEventRow = {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  fromStage: string | null;
  toStage: string | null;
  actorId: string | null;
  actorName: string | null;
  reason: string | null;
  occurredAt: Date;
};

function toOrderStatusEvent(row: OrderStatusEventRow): OrderStatusEvent {
  return {
    id: row.id,
    orderId: row.orderId,
    fromStatus: (row.fromStatus as OrderStatus | null) ?? undefined,
    toStatus: row.toStatus as OrderStatus,
    fromStage: (row.fromStage as TrackingMilestone | null) ?? undefined,
    toStage: (row.toStage as TrackingMilestone | null) ?? undefined,
    actorId: row.actorId ?? undefined,
    actorName: row.actorName ?? undefined,
    reason: row.reason ?? undefined,
    occurredAt: row.occurredAt.toISOString(),
  };
}
