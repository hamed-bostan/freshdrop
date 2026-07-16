import type { WalletTransaction } from "@/src/domain/entities/Wallet";
import {
  WALLET_DYNAMIC_DESCRIPTIONS,
  WALLET_STATIC_DESCRIPTIONS,
  type DynamicDescriptionKey,
  type StaticDescriptionKey,
} from "@/src/domain/entities/WalletTransactionDescription";

/**
 * Resolve a wallet transaction to a localizable message key under
 * `wallet.transactions`. The stored machine `reason` is authoritative; rows that
 * predate it (reason NULL, or an unrecognized value) fall back to matching the
 * English `description` against the same vocabulary, and anything still
 * unrecognized renders as stored. Both paths read the one domain module the
 * writers compose from (`WalletTransactionDescription`), so writer and reader
 * can't drift.
 */

const STATIC_ENTRIES = Object.entries(WALLET_STATIC_DESCRIPTIONS) as [StaticDescriptionKey, string][];
const DYNAMIC_ENTRIES = Object.entries(WALLET_DYNAMIC_DESCRIPTIONS) as [DynamicDescriptionKey, string][];

/** A recognised transaction resolved to a localizable key (plus the item name for dynamic ones). */
export type ResolvedTransaction =
  | { kind: "static"; key: StaticDescriptionKey }
  | { kind: "dynamic"; key: DynamicDescriptionKey; item: string };

/**
 * Map a transaction to a message key, or `null` when it's not one we localize —
 * the caller then shows the stored description as-is.
 */
export function resolveTransaction(transaction: WalletTransaction): ResolvedTransaction | null {
  return resolveReason(transaction.reason, transaction.reasonItem) ?? resolveDescription(transaction.description);
}

/** The stored machine reason, validated against the vocabulary. */
function resolveReason(reason: string | null, item: string | null): ResolvedTransaction | null {
  if (!reason) return null;
  if (reason in WALLET_STATIC_DESCRIPTIONS) {
    return { kind: "static", key: reason as StaticDescriptionKey };
  }
  if (reason in WALLET_DYNAMIC_DESCRIPTIONS && item) {
    return { kind: "dynamic", key: reason as DynamicDescriptionKey, item };
  }
  return null;
}

/** Legacy fallback: recognize the English description on rows without a reason. */
function resolveDescription(description: string): ResolvedTransaction | null {
  for (const [key, text] of STATIC_ENTRIES) {
    if (description === text) return { kind: "static", key };
  }

  for (const [key, prefix] of DYNAMIC_ENTRIES) {
    if (description.startsWith(prefix)) {
      return { kind: "dynamic", key, item: description.slice(prefix.length) };
    }
  }

  return null;
}
