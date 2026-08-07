import { ValidationError } from "../../errors/ValidationError";

import type { IWalletRepository } from "../../repositories/IWalletRepository";

/** Largest single top-up, mirroring the add-money keypad's digit cap (6 digits). */
const MAX_FUNDS = 999_999;

/**
 * Add money to the user's wallet. A last-resort domain guard behind the form's
 * schema validation (a direct caller still can't credit a non-positive or absurd
 * amount). The repository records the balance change and its transaction together.
 */
export class AddFunds {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(userId: string, amount: number): Promise<void> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError("amount", "Enter an amount greater than zero.");
    }
    if (amount > MAX_FUNDS) {
      throw new ValidationError("amount", "That amount is too large.");
    }
    await this.walletRepo.addFunds(userId, amount);
  }
}
