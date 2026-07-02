import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import {
  bookedCountKey,
  type IDeliverySlotRepository,
} from "@/src/domain/repositories/IDeliverySlotRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Delivery windows + their booking ledger, backed by PostgreSQL via Prisma.
 * Server-side only — bound through the container, never imported by client code.
 */
export class PrismaDeliverySlotRepository implements IDeliverySlotRepository {
  async listWindows(): Promise<DeliveryWindow[]> {
    const rows = await prisma.deliveryWindow.findMany({ orderBy: { position: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      startMinutes: row.startMinutes,
      endMinutes: row.endMinutes,
      capacity: row.capacity,
      position: row.position,
    }));
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
}
