import { taxFromGross } from "./TaxSettings";
import { round2 } from "@/src/lib/money";

/**
 * Why money moved back to a customer.
 *
 * `cancellation` and `return` are the two guarded-status flows (`CancelOrder`,
 * `ResolveOrderReturn`) that refund the order's full `total`. `substitution` is
 * the picker's per-line out-of-stock resolution. `manual` is a discretionary
 * partial refund an admin issues outside any of those (see phase 7).
 */
export const REFUND_KINDS = ["cancellation", "return", "substitution", "manual"] as const;
export type RefundKind = (typeof REFUND_KINDS)[number];

/**
 * One order line's share of a refund. `quantity` is present for a substitution or
 * discretionary refund of specific units; absent when the refund doesn't break
 * down by unit count (e.g. a delivery-fee component).
 */
export type RefundLine = {
  orderItemId: string;
  productId: string;
  quantity?: number;
  amount: number;
  taxAmount: number;
};

/**
 * An auditable record of money credited back to a customer's wallet.
 *
 * The record `CancelOrder`, `ResolveOrderReturn` and the picker's substitution
 * flow were missing: each already calls `wallets.addFunds`, but nothing recorded
 * that a refund happened, who authorized it, why, or which lines it covered. This
 * is that record — one row per credit, append-only (no update, no delete; a
 * correction is a new refund, the same reasoning `OrderNote` and `IActivityLog`
 * are built on).
 */
export type Refund = {
  id: string;
  orderId: string;
  userId: string;
  kind: RefundKind;
  /** Total credited to the wallet for this refund — matches the `addFunds` amount it accompanies. */
  amount: number;
  /** VAT portion of `amount`, derived via {@link taxShareOfRefund}. 0 when tax wasn't in effect or the refund was exempt. */
  taxAmount: number;
  /** Why, for a discretionary refund — absent for the guarded-status flows, which are self-explanatory. */
  reason?: string;
  /** Who issued it — absent for flows the customer triggers themselves (cancellation, return request). */
  actorId?: string;
  /** The actor's display name, snapshotted at write time (see `OrderNote.authorName`). */
  actorName?: string;
  /** ISO 8601 timestamp (UTC). Formatted in the presentation layer. */
  createdAt: string;
  lines: RefundLine[];
};

/** Total already refunded on an order, across every recorded `Refund`. */
export function refundedSoFar(refunds: Refund[]): number {
  return round2(refunds.reduce((sum, refund) => sum + refund.amount, 0));
}

/**
 * What's left to refund on an order: `total` minus what's already been credited
 * back, clamped at 0. The cap a discretionary refund (phase 7) must enforce.
 */
export function refundableRemaining(orderTotal: number, refunds: Refund[]): number {
  return Math.max(round2(orderTotal - refundedSoFar(refunds)), 0);
}

/**
 * The VAT portion of a refund `amount`, given the order's snapshotted tax rate.
 * Reuses {@link taxFromGross}: a tax-inclusive amount being refunded inherently
 * refunds its VAT share too, so crediting the wallet needs no adjustment — this
 * only reports the split for the record. 0 when the order predates tax
 * (`taxRate` is `null`) or `amount` isn't positive.
 */
export function taxShareOfRefund(amount: number, taxRate: number | null): number {
  if (taxRate === null) return 0;
  return taxFromGross(amount, taxRate);
}
