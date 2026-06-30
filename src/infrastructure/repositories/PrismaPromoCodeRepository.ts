import type { PromoCode } from "@/src/domain/entities/PromoCode";
import type { IPromoCodeRepository } from "@/src/domain/repositories/IPromoCodeRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Promo codes backed by PostgreSQL via Prisma. Server-side only (it opens a DB
 * connection), bound through the container — never imported by client code.
 */
export class PrismaPromoCodeRepository implements IPromoCodeRepository {
  async getAvailable(): Promise<PromoCode[]> {
    // Stable, authored order (ids "1".."4") so the list reads the same each load.
    const rows = await prisma.promoCode.findMany({ orderBy: { id: "asc" } });
    return rows.map(toPromoCode);
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const row = await prisma.promoCode.findFirst({
      where: { code: { equals: code.trim(), mode: "insensitive" } },
    });
    return row ? toPromoCode(row) : null;
  }
}

type PromoCodeRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
};

function toPromoCode(row: PromoCodeRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    discountPercent: row.discountPercent,
  };
}
