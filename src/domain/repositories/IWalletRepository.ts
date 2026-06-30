import type { SavedCard, Wallet } from "../entities/Wallet";

export type IWalletRepository = {
  /** The user's wallet aggregate: balance + saved cards + recent transactions. */
  getWallet(userId: string): Promise<Wallet>;
  /** The user's saved cards alone (for the payment-methods screen). */
  listCards(userId: string): Promise<SavedCard[]>;
  /** Persist a new saved card (display fields already derived) and return it. */
  addCard(userId: string, card: Omit<SavedCard, "id">): Promise<SavedCard>;
  /** Credit the wallet by `amount`, recording the matching transaction atomically. */
  addFunds(userId: string, amount: number): Promise<void>;
}
