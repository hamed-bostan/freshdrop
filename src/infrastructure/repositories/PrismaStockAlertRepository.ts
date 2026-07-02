import type { IStockAlertRepository } from "@/src/domain/repositories/IStockAlertRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Back-in-stock subscriptions backed by PostgreSQL via Prisma. One row per (user,
 * product) — the composite unique key makes subscribing idempotent. Server-side
 * only, bound through the container; never imported by client code.
 */
export class PrismaStockAlertRepository implements IStockAlertRepository {
  async subscribe(userId: string, productId: string): Promise<void> {
    // Upsert so a repeat subscription is a no-op rather than a unique-key error.
    await prisma.stockAlert.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
  }

  async unsubscribe(userId: string, productId: string): Promise<void> {
    // deleteMany (not delete) so removing an absent subscription is a no-op.
    await prisma.stockAlert.deleteMany({ where: { userId, productId } });
  }

  async isSubscribed(userId: string, productId: string): Promise<boolean> {
    const row = await prisma.stockAlert.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    return row != null;
  }

  async listSubscriberIds(productId: string): Promise<string[]> {
    const rows = await prisma.stockAlert.findMany({
      where: { productId },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  async clearForProduct(productId: string): Promise<void> {
    await prisma.stockAlert.deleteMany({ where: { productId } });
  }
}
