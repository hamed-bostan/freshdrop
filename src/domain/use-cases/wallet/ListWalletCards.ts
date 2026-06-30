import type { SavedCard } from "../../entities/Wallet";
import type { IWalletRepository } from "../../repositories/IWalletRepository";

/** The signed-in user's saved cards, for the payment-methods screen. */
export class ListWalletCards {
  constructor(private readonly walletRepo: IWalletRepository) {}

  execute(userId: string): Promise<SavedCard[]> {
    return this.walletRepo.listCards(userId);
  }
}
