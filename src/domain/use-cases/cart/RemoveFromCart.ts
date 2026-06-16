import type { ICartRepository } from "../../repositories/ICartRepository";

export class RemoveFromCart {
  constructor(private readonly cartRepo: ICartRepository) {}

  execute(productId: string): Promise<void> {
    return this.cartRepo.removeItem(productId);
  }
}
