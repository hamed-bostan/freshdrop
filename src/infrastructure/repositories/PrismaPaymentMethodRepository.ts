import type { PaymentMethod, PaymentMethodGroup } from "@/src/domain/entities/PaymentMethod";
import type { IPaymentMethodRepository } from "@/src/domain/repositories/IPaymentMethodRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * The payment-option catalog backed by PostgreSQL via Prisma. Reference data (not
 * per-user) — a fixed, ordered list the checkout and payment screens read.
 * Server-side only — bound through the container, never imported by client code.
 */
export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  async getAll(): Promise<PaymentMethod[]> {
    const rows = await prisma.paymentMethod.findMany({ orderBy: { position: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      group: row.group as PaymentMethodGroup,
    }));
  }
}
