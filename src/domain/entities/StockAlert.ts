/**
 * A shopper's standing request to be notified when an out-of-stock product is
 * available again. Created from the product screen while the item shows out of
 * stock; fulfilled and removed when the product is restocked.
 */
export type StockAlert = {
  id: string;
  userId: string;
  productId: string;
  /** ISO timestamp the subscription was created. */
  createdAt: string;
};
