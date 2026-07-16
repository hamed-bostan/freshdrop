export type CardBrand = "Visa" | "Mastercard";

export type SavedCard = {
  id: string;
  brand: CardBrand;
  holderName: string;
  /**
   * Display card number. In a real system this would be masked/tokenised
   * (PCI) — only a last-4 is ever stored client-side.
   */
  number: string;
  /** Expiry as MM/YY. */
  expiry: string;
}

/**
 * The raw card details captured by the add-card form, before the domain derives
 * the display fields. `number` is the entered PAN (digits, possibly spaced) — it
 * is masked to a last-4 display number and never persisted in full; the brand is
 * inferred from it. Expiry is supplied as separate month/year parts.
 */
export type NewCard = {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
}

export type TransactionType = "credit" | "debit";

export type WalletTransaction = {
  id: string;
  /** English display snapshot — the fallback when `reason` is absent/unrecognized. */
  description: string;
  /**
   * Machine reason (a `WalletTransactionDescription` vocabulary key), with the item
   * name for the per-item reasons. `null` on rows that predate the columns; the
   * presentation layer localizes from these and falls back to `description`.
   */
  reason: string | null;
  reasonItem: string | null;
  /** ISO 8601 timestamp (UTC). Formatted for display in the presentation layer. */
  date: string;
  /** Absolute amount; the sign is derived from `type`. */
  amount: number;
  type: TransactionType;
}

/** Aggregate for the wallet screen: balance + saved cards + recent activity. */
export type Wallet = {
  balance: number;
  cards: SavedCard[];
  transactions: WalletTransaction[];
}
