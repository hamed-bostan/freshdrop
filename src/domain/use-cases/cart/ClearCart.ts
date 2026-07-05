import type { ICartRepository } from "../../repositories/ICartRepository";

export class ClearCart {
  constructor(private readonly cartRepo: ICartRepository) {}

  execute(userId: string): Promise<void> {
    return this.cartRepo.clear(userId);
  }
}
