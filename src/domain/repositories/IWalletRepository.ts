import type { Wallet } from "../entities/Wallet";

export interface IWalletRepository {
  getWallet(): Promise<Wallet>;
}
