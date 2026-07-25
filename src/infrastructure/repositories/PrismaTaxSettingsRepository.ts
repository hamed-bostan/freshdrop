import type { TaxSettings } from "@/src/domain/entities/TaxSettings";
import type { ITaxSettingsRepository, TaxSettingsInput } from "@/src/domain/repositories/ITaxSettingsRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

const SINGLETON_ID = "singleton";

/**
 * The store's tax configuration, backed by PostgreSQL via Prisma. A single row,
 * created lazily on first read with the schema's defaults (rate 0, disabled) —
 * there is no seed migration for it, so a fresh deployment just works.
 */
export class PrismaTaxSettingsRepository implements ITaxSettingsRepository {
  async get(): Promise<TaxSettings> {
    const row = await prisma.taxSetting.findUnique({ where: { id: SINGLETON_ID } });
    if (row) return toTaxSettings(row);

    const created = await prisma.taxSetting.create({ data: { id: SINGLETON_ID } });
    return toTaxSettings(created);
  }

  async update(input: TaxSettingsInput): Promise<TaxSettings> {
    const row = await prisma.taxSetting.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        ratePercent: input.ratePercent,
        enabled: input.enabled,
        updatedById: input.updatedById,
      },
      update: {
        ratePercent: input.ratePercent,
        enabled: input.enabled,
        updatedById: input.updatedById,
      },
    });
    return toTaxSettings(row);
  }
}

function toTaxSettings(row: {
  ratePercent: number;
  enabled: boolean;
  updatedAt: Date;
  updatedById: string | null;
}): TaxSettings {
  return {
    ratePercent: row.ratePercent,
    enabled: row.enabled,
    updatedAt: row.updatedAt,
    updatedById: row.updatedById,
  };
}
