import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { InsufficientStockError } from "../../errors/InsufficientStockError";

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

    // Fail fast at the door: the cart may never hold more units than are on hand.
    // Accumulate onto any existing line and compare the running total to stock, so
    // an out-of-stock or over-limit add is refused here — not left to surprise the
    // shopper at checkout. The transactional decrement at checkout is still the
    // authoritative guard; this is the same rule enforced earlier for better UX.
    const items = await this.cartRepo.getItems(userId);
    const existing = items.find((item) => item.product.id === productId)?.quantity ?? 0;
    const desired = existing + quantity;
    if (desired > product.stockQuantity) {
      throw new InsufficientStockError([
        { productId, name: product.name, available: product.stockQuantity, requested: desired },
      ]);
    }

    await this.cartRepo.addItem(userId, productId, quantity);
  }
}
