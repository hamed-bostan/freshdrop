export type CardBrand = "Visa" | "Mastercard";

export interface SavedCard {
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

export type TransactionType = "credit" | "debit";

export interface WalletTransaction {
  id: string;
  description: string;
  /** ISO 8601 timestamp (UTC). Formatted for display in the presentation layer. */
  date: string;
  /** Absolute amount; the sign is derived from `type`. */
  amount: number;
  type: TransactionType;
}

/** Aggregate for the wallet screen: balance + saved cards + recent activity. */
export interface Wallet {
  balance: number;
  cards: SavedCard[];
  transactions: WalletTransaction[];
}
