import type { CartItem } from "@/src/domain/entities/Cart";
import type { ICartRepository } from "@/src/domain/repositories/ICartRepository";

export class CartRepository implements ICartRepository {
  constructor(private readonly baseUrl: string) {}

  async getItems(): Promise<CartItem[]> {
    const res = await fetch(`${this.baseUrl}/cart`);
    return res.json();
  }

  async addItem(productId: string, quantity: number): Promise<void> {
    await fetch(`${this.baseUrl}/cart/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async removeItem(productId: string): Promise<void> {
    await fetch(`${this.baseUrl}/cart/items/${productId}`, {
      method: "DELETE",
    });
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    await fetch(`${this.baseUrl}/cart/items/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
  }

  async clear(): Promise<void> {
    await fetch(`${this.baseUrl}/cart`, { method: "DELETE" });
  }
}
