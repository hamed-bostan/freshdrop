import type { DeliveryOption } from "@/src/domain/entities/DeliveryOption";
import type { IDeliveryOptionRepository } from "@/src/domain/repositories/IDeliveryOptionRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * The delivery-time catalog backed by PostgreSQL via Prisma. Reference data (not
 * per-user) — a fixed, ordered list the checkout screen reads. Server-side only —
 * bound through the container, never imported by client code.
 */
export class PrismaDeliveryOptionRepository implements IDeliveryOptionRepository {
  async getAll(): Promise<DeliveryOption[]> {
    const rows = await prisma.deliveryOption.findMany({ orderBy: { position: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      eta: row.eta,
    }));
  }
}
