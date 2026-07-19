import { Prisma } from "@prisma/client";
import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import {
  bookedCountKey,
  type DeliveryWindowInput,
  type IDeliverySlotRepository,
} from "@/src/domain/repositories/IDeliverySlotRepository";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Delivery windows + their booking ledger, backed by PostgreSQL via Prisma.
 * Server-side only — bound through the container, never imported by client code.
 */
export class PrismaDeliverySlotRepository implements IDeliverySlotRepository {
  async listWindows(): Promise<DeliveryWindow[]> {
    const rows = await prisma.deliveryWindow.findMany({ orderBy: { position: "asc" } });
    return rows.map(toDeliveryWindow);
  }

  async getBookedCounts(dates: string[]): Promise<Record<string, number>> {
    if (dates.length === 0) return {};
    const rows = await prisma.deliverySlotBooking.findMany({
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
    return prisma.$transaction(async (tx) => {
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
    await prisma.deliverySlotBooking.updateMany({
      where: { date, windowId, booked: { gt: 0 } },
      data: { booked: { decrement: 1 } },
    });
  }

  async getWindow(id: string): Promise<DeliveryWindow | null> {
    const row = await prisma.deliveryWindow.findUnique({ where: { id } });
    return row ? toDeliveryWindow(row) : null;
  }

  async createWindow(window: DeliveryWindow): Promise<DeliveryWindow> {
    try {
      const row = await prisma.deliveryWindow.create({ data: window });
      return toDeliveryWindow(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async updateWindow(id: string, input: DeliveryWindowInput): Promise<DeliveryWindow> {
    try {
      const row = await prisma.deliveryWindow.update({ where: { id }, data: input });
      return toDeliveryWindow(row);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async deleteWindow(id: string): Promise<void> {
    try {
      // The ledger rows are keyed by (date, windowId) with no foreign key — the
      // schema's loose coupling — so they'd outlive the window. They go with it:
      // each one counts bookings against a window that no longer exists, and
      // nothing will read them again. The use-case has already refused the delete
      // if any of them are still upcoming.
      await prisma.$transaction([
        prisma.deliverySlotBooking.deleteMany({ where: { windowId: id } }),
        prisma.deliveryWindow.delete({ where: { id } }),
      ]);
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async countBookingsFrom(windowId: string, fromDate: string): Promise<number> {
    // `date` is a `YYYY-MM-DD` string, which orders lexicographically exactly as it
    // orders chronologically — so a string `gte` *is* a date comparison here.
    const result = await prisma.deliverySlotBooking.aggregate({
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
