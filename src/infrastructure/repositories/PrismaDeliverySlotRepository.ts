import { Prisma } from "@prisma/client";

import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import type { AuditHook } from "@/src/domain/repositories/AuditHook";
import {
  bookedCountKey,
  type DeliveryWindowInput,
  type IDeliverySlotRepository,
} from "@/src/domain/repositories/IDeliverySlotRepository";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";

import { recordAudit } from "./writeActivityEntry";

/**
 * Delivery windows + their booking ledger, backed by PostgreSQL via Prisma.
 * Server-side only — bound through the container, never imported by client code.
 */
export class PrismaDeliverySlotRepository implements IDeliverySlotRepository {
  /**
   * The root client normally, a transaction client when a unit of work handed this
   * repository out — which is what lets checkout claim a slot in the same
   * transaction that decrements stock and writes the order.
   */
  constructor(private readonly db: PrismaDb = prisma) {}

  async listWindows(): Promise<DeliveryWindow[]> {
    const rows = await this.db.deliveryWindow.findMany({ orderBy: { position: "asc" } });
    return rows.map(toDeliveryWindow);
  }

  async getBookedCounts(dates: string[]): Promise<Record<string, number>> {
    if (dates.length === 0) return {};
    const rows = await this.db.deliverySlotBooking.findMany({
      where: { date: { in: dates } },
      select: { date: true, windowId: true, booked: true },
    });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[bookedCountKey(row.date, row.windowId)] = row.booked;
    }
    return counts;
  }

  async claim(date: string, windowId: string, capacity: number): Promise<boolean> {
    return inTransaction(this.db, async (tx) => {
      // Ensure the ledger row exists (idempotent) so the guarded increment below
      // has a row to hit; a fresh row starts at booked = 0.
      await tx.deliverySlotBooking.upsert({
        where: { date_windowId: { date, windowId } },
        create: { date, windowId, booked: 0 },
        update: {},
      });

      // Fold `booked < capacity` into the WHERE clause so the check and the
      // increment are one atomic statement — the oversell guard. `count` is 1 only
      // when this call actually took the last-available unit.
      const result = await tx.deliverySlotBooking.updateMany({
        where: { date, windowId, booked: { lt: capacity } },
        data: { booked: { increment: 1 } },
      });
      return result.count === 1;
    });
  }

  async release(date: string, windowId: string): Promise<void> {
    // Guarded by `booked > 0` in the WHERE clause, the mirror of the `booked <
    // capacity` guard on the claim: the check and the decrement are one atomic
    // statement, so a release racing another placement can't drive the ledger
    // negative and hand out capacity that was never there. A row that's already
    // at 0 (or absent) simply matches nothing, which makes the release safe to
    // repeat.
    await this.db.deliverySlotBooking.updateMany({
      where: { date, windowId, booked: { gt: 0 } },
      data: { booked: { decrement: 1 } },
    });
  }

  async getWindow(id: string): Promise<DeliveryWindow | null> {
    const row = await this.db.deliveryWindow.findUnique({ where: { id } });
    return row ? toDeliveryWindow(row) : null;
  }

  async createWindow(
    window: DeliveryWindow,
    audit?: AuditHook<DeliveryWindow>,
  ): Promise<DeliveryWindow> {
    try {
      const row = await inTransaction(this.db, async (tx) => {
        const created = await tx.deliveryWindow.create({ data: window });
        await recordAudit(tx, toDeliveryWindow(created), audit);
        return created;
      });
      return toDeliveryWindow(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async updateWindow(
    id: string,
    input: DeliveryWindowInput,
    audit?: AuditHook<DeliveryWindow>,
  ): Promise<DeliveryWindow> {
    try {
      const row = await inTransaction(this.db, async (tx) => {
        const updated = await tx.deliveryWindow.update({ where: { id }, data: input });
        await recordAudit(tx, toDeliveryWindow(updated), audit);
        return updated;
      });
      return toDeliveryWindow(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async deleteWindow(id: string, audit?: AuditHook<void>): Promise<void> {
    try {
      // The ledger rows are keyed by (date, windowId) with no foreign key — the
      // schema's loose coupling — so they'd outlive the window. They go with it:
      // each one counts bookings against a window that no longer exists, and
      // nothing will read them again. The use-case has already refused the delete
      // if any of them are still upcoming.
      // Interactive rather than a batch array, so the audit entry can join the
      // same transaction — it is the only record the window ever existed.
      await inTransaction(this.db, async (tx) => {
        await tx.deliverySlotBooking.deleteMany({ where: { windowId: id } });
        await tx.deliveryWindow.delete({ where: { id } });
        await recordAudit(tx, undefined, audit);
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async countBookingsFrom(windowId: string, fromDate: string): Promise<number> {
    // `date` is a `YYYY-MM-DD` string, which orders lexicographically exactly as it
    // orders chronologically — so a string `gte` *is* a date comparison here.
    const result = await this.db.deliverySlotBooking.aggregate({
      where: { windowId, date: { gte: fromDate } },
      _sum: { booked: true },
    });
    return result._sum.booked ?? 0;
  }
}

function toDeliveryWindow(row: {
  id: string;
  label: string;
  startMinutes: number;
  endMinutes: number;
  capacity: number;
  position: number;
}): DeliveryWindow {
  return {
    id: row.id,
    label: row.label,
    startMinutes: row.startMinutes,
    endMinutes: row.endMinutes,
    capacity: row.capacity,
    position: row.position,
  };
}

/**
 * Translate Prisma's unique-violation (P2002) into a transport-agnostic domain
 * error so callers never branch on Prisma codes; every other error passes through.
 */
function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: unique violation (here, a re-used window slug). P2025: the targeted
    // row no longer exists (lost a race with another admin).
    if (error.code === "P2002") return new UniqueConstraintError(uniqueTargetFields(error), { cause: error });
    if (error.code === "P2025") return new NotFoundError("delivery window", undefined, { cause: error });
  }
  return error;
}

/** Best-effort extraction of the offending field names from a P2002 `meta.target`. */
function uniqueTargetFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === "string") return [target];
  return [];
}
