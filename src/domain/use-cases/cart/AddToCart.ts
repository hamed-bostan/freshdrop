import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
}

export class AddToCart {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute({ productId, quantity = 1 }: AddToCartRequest): Promise<void> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    await this.cartRepo.addItem(productId, quantity);
  }
}
