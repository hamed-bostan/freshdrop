/**
 * Wallet transaction descriptions are written in English by the order use-cases
 * and `PrismaWalletRepository.addFunds`, then persisted, so the presentation layer
 * localizes them here — same approach as `localizedPromos`. A description we don't
 * recognise (a reason added later, or legacy data) falls back to the stored copy,
 * so it still renders, just in the original language.
 *
 * The mapped strings must stay in sync with what those writers emit; keeping the
 * list here (and the copy under `wallet.transactions`) is the single source of
 * truth the render reads from.
 */

// Exact descriptions → message key under `wallet.transactions`.
const STATIC_KEYS = {
  "Added to Wallet": "addedToWallet",
  "Refund for cancelled order": "refundCancelledOrder",
  "Refund for cancelled order delivery": "refundCancelledOrderDelivery",
  "Refund for returned order": "refundReturnedOrder",
} as const;

// Descriptions built as `<prefix><item name>` → a message key taking an `{item}` param.
const DYNAMIC_KEYS = [
  { prefix: "Refund for out-of-stock ", key: "refundOutOfStock" },
  { prefix: "Substitution saving for ", key: "substitutionSaving" },
] as const;

type StaticKey = (typeof STATIC_KEYS)[keyof typeof STATIC_KEYS];
type DynamicKey = (typeof DYNAMIC_KEYS)[number]["key"];

/** A recognised description resolved to a localizable key (plus the item name for dynamic ones). */
export type ResolvedTransaction =
  | { kind: "static"; key: StaticKey }
  | { kind: "dynamic"; key: DynamicKey; item: string };

/**
 * Map a stored transaction description to a message key, or `null` when it's not
 * one we localize — the caller then shows the stored string as-is.
 */
export function resolveTransactionDescription(description: string): ResolvedTransaction | null {
  const staticKey = (STATIC_KEYS as Record<string, StaticKey | undefined>)[description];
  if (staticKey) return { kind: "static", key: staticKey };

  for (const { prefix, key } of DYNAMIC_KEYS) {
    if (description.startsWith(prefix)) {
      return { kind: "dynamic", key, item: description.slice(prefix.length) };
    }
  }

  return null;
}
