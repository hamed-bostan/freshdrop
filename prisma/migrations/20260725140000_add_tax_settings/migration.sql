-- Typed singleton for the store's VAT configuration. Additive only — no
-- existing table changes, no backfill. Ships disabled: `enabled` defaults to
-- false and nothing reads this table yet (see TaxSettings phase 1).

-- CreateTable
CREATE TABLE "tax_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "rate_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
);
