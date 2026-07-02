/**
 * Back-in-stock subscriptions, scoped to a `userId` (per-user data, like the cart
 * and favorites). One subscription per (user, product); subscribing twice is a
 * no-op. The restock flow reads subscribers by product, then clears them.
 */
export type IStockAlertRepository = {
  /** Subscribe a user to a product's back-in-stock alert (idempotent). */
  subscribe(userId: string, productId: string): Promise<void>;
  /** Unsubscribe (idempotent — removing an absent subscription is a no-op). */
  unsubscribe(userId: string, productId: string): Promise<void>;
  /** Whether the user is subscribed to this product. */
  isSubscribed(userId: string, productId: string): Promise<boolean>;
  /** The ids of every user waiting on this product — the recipients when it restocks. */
  listSubscriberIds(productId: string): Promise<string[]>;
  /** Remove all subscriptions for a product (after its waiters have been notified). */
  clearForProduct(productId: string): Promise<void>;
}
