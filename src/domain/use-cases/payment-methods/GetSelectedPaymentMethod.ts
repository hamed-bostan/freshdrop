import type { IUserRepository } from "../../repositories/IUserRepository";

/**
 * The id of the payment method the signed-in user last selected for checkout, or
 * `null` if they haven't chosen one. A thin per-user read; the presentation layer
 * resolves it against the current catalog + saved cards and falls back to the first
 * option when the stored id is stale (e.g. a card that was later removed).
 */
export class GetSelectedPaymentMethod {
  constructor(private readonly userRepo: IUserRepository) {}

  execute(userId: string): Promise<string | null> {
    return this.userRepo.getSelectedPaymentMethodId(userId);
  }
}
