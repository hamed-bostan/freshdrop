import type { Wallet } from "../../entities/Wallet";
import type { IWalletRepository } from "../../repositories/IWalletRepository";

export class GetWallet {
  constructor(private readonly walletRepo: IWalletRepository) {}

  execute(userId: string): Promise<Wallet> {
    return this.walletRepo.getWallet(userId);
  }
}
