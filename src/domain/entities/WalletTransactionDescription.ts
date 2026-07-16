/**
 * The vocabulary of wallet-transaction reasons. A credit is recorded with a machine
 * `reason` (a key below, plus the item name for the per-item ones) alongside an
 * English `description` snapshot composed here — the presentation layer localizes
 * from the reason and only falls back to recognizing the description on legacy rows
 * (`localizedTransaction.ts`). Writers and the reader import this one module, so the
 * two can never drift. The keys double as the message keys under
 * `wallet.transactions`.
 */

/** Fixed descriptions. Keys mirror `wallet.transactions.*` messages. */
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

export type StaticDescriptionKey = keyof typeof WALLET_STATIC_DESCRIPTIONS;
export type DynamicDescriptionKey = keyof typeof WALLET_DYNAMIC_DESCRIPTIONS;

/** Why a wallet credit happened — what the writers record and the reader localizes. */
export type WalletTransactionReason =
  | { kind: StaticDescriptionKey }
  | { kind: DynamicDescriptionKey; item: string };

/** The canonical stored (English) description snapshot for a reason. */
export function describeTransaction(reason: WalletTransactionReason): string {
  return "item" in reason
    ? `${WALLET_DYNAMIC_DESCRIPTIONS[reason.kind]}${reason.item}`
    : WALLET_STATIC_DESCRIPTIONS[reason.kind];
}
