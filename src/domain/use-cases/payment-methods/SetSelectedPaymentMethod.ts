import type { IUserRepository } from "../../repositories/IUserRepository";
import type { IPaymentMethodRepository } from "../../repositories/IPaymentMethodRepository";
import type { IWalletRepository } from "../../repositories/IWalletRepository";
import { ValidationError } from "../../errors/ValidationError";

/**
 * Persist the payment method the signed-in user selected for checkout. The id must
 * be a real option for this user — a catalog method (Cash, Wallet, PayPal, …) or one
 * of their own saved cards — re-validated here rather than trusted from the client,
 * so a stale or forged id can never be stored. Idempotent: re-selecting the same
 * method persists the same value.
 */
export class SetSelectedPaymentMethod {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
    private readonly walletRepo: IWalletRepository,
  ) {}

  async execute(userId: string, methodId: string): Promise<void> {
    // The selectable set is the public catalog plus the caller's own saved cards —
    // resolve both and reject anything that isn't one of them.
    const [methods, cards] = await Promise.all([
      this.paymentMethodRepo.getAll(),
      this.walletRepo.listCards(userId),
    ]);
    const selectable =
      methods.some((method) => method.id === methodId) || cards.some((card) => card.id === methodId);
    if (!selectable) {
      throw new ValidationError("methodId", "That payment method isn't available.");
    }

    await this.userRepo.setSelectedPaymentMethodId(userId, methodId);
  }
}
