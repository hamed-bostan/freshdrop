/**
 * The canonical vocabulary of wallet-transaction descriptions — the exact strings the
 * order use-cases and the wallet repository persist. Stored English is the domain's
 * single source of truth (like every other stored value); the presentation layer
 * localizes at read time by *recognizing* these strings (`localizedTransaction.ts`).
 *
 * Writers and the reader import this one module, so the two can never drift: a new
 * reason added here is immediately parseable, and a description composed anywhere
 * else simply falls back to rendering as stored. The object keys double as the
 * message keys under `wallet.transactions`.
 */

/** Fixed descriptions, matched exactly. Keys mirror `wallet.transactions.*` messages. */
export const WALLET_STATIC_DESCRIPTIONS = {
  addedToWallet: "Added to Wallet",
  refundCancelledOrder: "Refund for cancelled order",
  refundCancelledOrderDelivery: "Refund for cancelled order delivery",
  refundReturnedOrder: "Refund for returned order",
} as const;

/** Prefixes for descriptions that carry an item name. Keys mirror `wallet.transactions.*`. */
export const WALLET_DYNAMIC_DESCRIPTIONS = {
  refundOutOfStock: "Refund for out-of-stock ",
  substitutionSaving: "Substitution saving for ",
} as const;

/** "Refund for out-of-stock ‹item›" — an out-of-stock line credited back. */
export function describeOutOfStockRefund(itemName: string): string {
  return `${WALLET_DYNAMIC_DESCRIPTIONS.refundOutOfStock}${itemName}`;
}

/** "Substitution saving for ‹item›" — a cheaper replacement's price difference. */
export function describeSubstitutionSaving(itemName: string): string {
  return `${WALLET_DYNAMIC_DESCRIPTIONS.substitutionSaving}${itemName}`;
}
