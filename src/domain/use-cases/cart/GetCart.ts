import type { Cart, CartItem } from "../../entities/Cart";
import type { ICartRepository } from "../../repositories/ICartRepository";

export class GetCart {
  constructor(private readonly cartRepo: ICartRepository) {}

  async execute(): Promise<Cart> {
    const items = await this.cartRepo.getItems();
    return this.buildCart(items);
  }

  private buildCart(items: CartItem[]): Cart {
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return {
      items,
      subtotal,
      total: subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }
}
