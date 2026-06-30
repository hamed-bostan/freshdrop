import type { ICartRepository } from "../../repositories/ICartRepository";

export class RemoveFromCart {
  constructor(private readonly cartRepo: ICartRepository) {}

  execute(userId: string, productId: string): Promise<void> {
    return this.cartRepo.removeItem(userId, productId);
  }
}
