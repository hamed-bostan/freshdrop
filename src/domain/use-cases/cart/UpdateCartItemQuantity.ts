import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { InsufficientStockError } from "../../errors/InsufficientStockError";

/** Upper bound for a single line's quantity (mirrors the cart UI's stepper cap). */
const MAX_QUANTITY = 99;

export type UpdateCartItemRequest = {
  userId: string;
  productId: string;
  /** The absolute quantity to set the line to. */
  quantity: number;
}

/**
 * Set a cart line to an absolute quantity. A non-positive quantity removes the
 * line; otherwise it's clamped to `MAX_QUANTITY`. The product must still exist.
 */
export class UpdateCartItemQuantity {
  constructor(
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute({ userId, productId, quantity }: UpdateCartItemRequest): Promise<void> {
    if (quantity <= 0) {
      await this.cartRepo.removeItem(userId, productId);
      return;
    }

    const product = await this.productRepo.getPublishedById(productId);
    if (!product) throw new NotFoundError("product");

    // The cart may never hold more units than are on hand — refuse a set that
    // would exceed stock (mirrors the accumulating guard in AddToCart).
    const clamped = Math.min(quantity, MAX_QUANTITY);
    if (clamped > product.stockQuantity) {
      throw new InsufficientStockError([
        { productId, name: product.name, available: product.stockQuantity, requested: clamped },
      ]);
    }

    await this.cartRepo.updateQuantity(userId, productId, clamped);
  }
}
