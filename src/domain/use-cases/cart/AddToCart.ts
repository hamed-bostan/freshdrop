import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { NotFoundError } from "../../errors/NotFoundError";

export type AddToCartRequest = {
  userId: string;
  productId: string;
  quantity?: number;
}

export class AddToCart {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute({ userId, productId, quantity = 1 }: AddToCartRequest): Promise<void> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new NotFoundError("product");

    await this.cartRepo.addItem(userId, productId, quantity);
  }
}
