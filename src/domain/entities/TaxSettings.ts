import { round2 } from "@/src/lib/money";

/**
 * The store's tax configuration — a single VAT rate applied store-wide, with
 * per-product exemption handled separately (see `Product.taxExempt`, phase 2).
 * Not multi-region: this is Iran VAT, one rate for the whole store.
 */
export type TaxSettings = {
  ratePercent: number;
  enabled: boolean;
  updatedAt: Date;
  updatedById: string | null;
};

/**
 * Derive the VAT portion out of a tax-inclusive gross amount.
 *
 * Prices in this store already include VAT — `total` never changes because of
 * tax, so this never adds to a price, only reports what portion of an
 * already-charged amount is tax. For a rate `r` (percent) and a tax-inclusive
 * `gross`, the tax is `gross * r / (100 + r)` — the standard "tax out" formula
 * for inclusive pricing.
 */
export function taxFromGross(gross: number, ratePercent: number): number {
  if (gross <= 0 || ratePercent <= 0) return 0;
  return round2((gross * ratePercent) / (100 + ratePercent));
}
