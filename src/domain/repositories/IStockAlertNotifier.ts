import type { Product } from "../entities/Product";

/**
 * Delivers back-in-stock notifications. A port (not an implementation) so the
 * domain stays channel-agnostic: today a logging stub stands in, tomorrow the
 * container can bind email/SMS/push without touching the use-cases — the same
 * Dependency Inversion the repositories use.
 */
export type IStockAlertNotifier = {
  /**
   * Tell each `userId` that `product` is available again. Best-effort: a delivery
   * failure must not roll back the restock that triggered it (the product update
   * has already succeeded), so callers treat this as a side effect, not a step.
   */
  notifyRestocked(product: Product, userIds: readonly string[]): Promise<void>;
}
