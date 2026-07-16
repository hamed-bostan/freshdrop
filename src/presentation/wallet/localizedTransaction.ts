import {
  WALLET_DYNAMIC_DESCRIPTIONS,
  WALLET_STATIC_DESCRIPTIONS,
} from "@/src/domain/entities/WalletTransactionDescription";

/**
 * Wallet transaction descriptions are written in English by the order use-cases
 * and `PrismaWalletRepository.addFunds`, then persisted, so the presentation layer
 * localizes them here — same approach as `localizedPromos`. A description we don't
 * recognise (legacy data, or text composed outside the shared vocabulary) falls
 * back to the stored copy, so it still renders, just in the original language.
 *
 * The recognised strings come from the same domain module the writers compose them
 * from (`WalletTransactionDescription`), so writer and reader can't drift; the
 * vocabulary's keys double as the message keys under `wallet.transactions`.
 */

type StaticKey = keyof typeof WALLET_STATIC_DESCRIPTIONS;
type DynamicKey = keyof typeof WALLET_DYNAMIC_DESCRIPTIONS;

const STATIC_ENTRIES = Object.entries(WALLET_STATIC_DESCRIPTIONS) as [StaticKey, string][];
const DYNAMIC_ENTRIES = Object.entries(WALLET_DYNAMIC_DESCRIPTIONS) as [DynamicKey, string][];

/** A recognised description resolved to a localizable key (plus the item name for dynamic ones). */
export type ResolvedTransaction =
  | { kind: "static"; key: StaticKey }
  | { kind: "dynamic"; key: DynamicKey; item: string };

/**
 * Map a stored transaction description to a message key, or `null` when it's not
 * one we localize — the caller then shows the stored string as-is.
 */
export function resolveTransactionDescription(description: string): ResolvedTransaction | null {
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
