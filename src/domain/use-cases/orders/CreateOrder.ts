import type { Cart } from "../../entities/Cart";
import type { Order, OrderItem } from "../../entities/Order";
import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { ValidationError } from "../../errors/ValidationError";

export type CreateOrderInput = {
  /** The user placing the order. */
  userId: string;
  /** Human-readable delivery address, resolved from the selected location. */
  location: string;
  /** The server-computed cart (items + authoritative totals) being checked out. */
  cart: Cart;
};

/**
 * Place an order: snapshot the cart into an owned, trackable order and empty the
 * cart. A freshly placed order is live (`current`), in progress (`processing`)
 * and at the first delivery milestone (`confirmed`). Totals and item prices come
 * from the server-computed cart — never the client — so the recorded amount can't
 * be tampered with.
 *
 * Stock is claimed before the order is recorded: the atomic decrement is the
 * overselling guard, and refusing here (throwing `InsufficientStockError`) means
 * an oversold cart never produces an order in the first place.
 */
export class CreateOrder {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute({ userId, location, cart }: CreateOrderInput): Promise<Order> {
    if (cart.items.length === 0) {
      throw new ValidationError("cart", "Your cart is empty.");
    }

    const items: OrderItem[] = cart.items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      quantity,
    }));

    // Claim the stock first (all-or-nothing). If anything is short this throws
    // before the order is created, so we never record an oversold order.
    await this.productRepo.decrementStock(
      cart.items.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        quantity,
      })),
    );

    const order = await this.orderRepo.createOrder({
      userId,
      status: "processing",
      phase: "current",
      stage: "confirmed",
      placedAt: new Date().toISOString(),
      location,
      total: cart.total,
      items,
    });

    // The order now owns the snapshot, so the working cart is emptied.
    await this.cartRepo.clear(userId);

    return order;
  }
}
