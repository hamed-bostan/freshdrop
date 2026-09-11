import type { SavedCard, Wallet } from "../entities/Wallet";
import type { WalletTransactionReason } from "../entities/WalletTransactionDescription";

export type IWalletRepository = {
  /** The user's wallet aggregate: balance + saved cards + recent transactions. */
  getWallet(userId: string): Promise<Wallet>;
  /** The user's saved cards alone (for the payment-methods screen). */
  listCards(userId: string): Promise<SavedCard[]>;
  /** Persist a new saved card (display fields already derived) and return it. */
  addCard(userId: string, card: Omit<SavedCard, "id">): Promise<SavedCard>;
  /**
   * Credit the wallet by `amount`, recording the matching transaction atomically.
   * `reason` says why (an order refund, a substitution saving, …) and is stored as
   * machine data alongside the English description snapshot derived from it; it
   * defaults to the plain top-up, so "add money" callers pass nothing.
   */
  addFunds(userId: string, amount: number, reason?: WalletTransactionReason): Promise<void>;

  /**
   * Debit the wallet by `amount`, recording the matching transaction atomically —
   * the reverse of {@link addFunds}, used to apply wallet balance against an
   * order's total at checkout. The balance check and the decrement are one
   * guarded write, so two concurrent spends of the same wallet can never take it
   * negative. Returns `true` when the debit landed, `false` when the balance was
   * less than `amount` (raced another spend, or it changed since the caller read
   * it) — nothing is written in that case.
   */
  deductFunds(userId: string, amount: number, reason?: WalletTransactionReason): Promise<boolean>;
}
