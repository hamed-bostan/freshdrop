import type { Wallet } from "@/src/domain/entities/Wallet";
import type { IWalletRepository } from "@/src/domain/repositories/IWalletRepository";

const WALLET: Wallet = {
  balance: 560.32,
  cards: [
    { id: "1", brand: "Visa", holderName: "Ben solo", number: "5896 5896 4581 4581", expiry: "05/25" },
    { id: "2", brand: "Visa", holderName: "Ben solo", number: "5896 5896 4581 4581", expiry: "05/25" },
  ],
  transactions: [
    { id: "1", description: "Apples", date: "2025-07-17T21:00:00Z", amount: 12.4, type: "debit" },
    { id: "2", description: "Added to Wallet", date: "2025-06-25T01:03:00Z", amount: 100, type: "credit" },
    { id: "3", description: "Red Meat", date: "2025-06-03T16:50:00Z", amount: 24.9, type: "debit" },
    { id: "4", description: "Added to Wallet", date: "2025-06-10T10:10:00Z", amount: 50, type: "credit" },
    { id: "5", description: "salmon fish", date: "2025-06-25T12:00:00Z", amount: 18.75, type: "debit" },
  ],
};

export class MockWalletRepository implements IWalletRepository {
  async getWallet(): Promise<Wallet> {
    return WALLET;
  }
}
