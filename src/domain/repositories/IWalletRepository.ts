import type { Wallet } from "../entities/Wallet";

export type IWalletRepository = {
  getWallet(): Promise<Wallet>;
}
