-- Per-product VAT exemption flag. Additive only. Defaults to true (exempt) so
-- every existing row reads as exempt until an operator opts it in — the safe
-- direction for a grocer (see TaxSettings phase 2).

-- AlterTable
ALTER TABLE "products" ADD COLUMN "tax_exempt" BOOLEAN NOT NULL DEFAULT true;
