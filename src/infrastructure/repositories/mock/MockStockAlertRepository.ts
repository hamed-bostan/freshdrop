import type { IStockAlertRepository } from "@/src/domain/repositories/IStockAlertRepository";

/**
 * In-memory back-in-stock subscriptions, indexed by product so the restock lookup
 * ("who's waiting on this product?") is direct. The container binds this as a
 * singleton, so subscriptions persist for the life of the server process — a
 * stand-in for real persistence, mirroring the other mocks.
 */
export class MockStockAlertRepository implements IStockAlertRepository {
  /** productId → set of subscribed userIds. */
  private readonly byProduct = new Map<string, Set<string>>();

  async subscribe(userId: string, productId: string): Promise<void> {
    const users = this.byProduct.get(productId) ?? new Set<string>();
    users.add(userId);
    this.byProduct.set(productId, users);
  }

  async unsubscribe(userId: string, productId: string): Promise<void> {
    const users = this.byProduct.get(productId);
    if (!users) return;
    users.delete(userId);
    if (users.size === 0) this.byProduct.delete(productId);
  }

  async isSubscribed(userId: string, productId: string): Promise<boolean> {
    return this.byProduct.get(productId)?.has(userId) ?? false;
  }

  async listSubscriberIds(productId: string): Promise<string[]> {
    return [...(this.byProduct.get(productId) ?? [])];
  }

  async clearForProduct(productId: string): Promise<void> {
    this.byProduct.delete(productId);
  }
}
