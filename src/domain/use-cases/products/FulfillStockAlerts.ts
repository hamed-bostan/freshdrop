import type { Product } from "../../entities/Product";
import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";
import type { IStockAlertNotifier } from "../../repositories/IStockAlertNotifier";

/**
 * Notify a product's back-in-stock subscribers and clear them.
 *
 * Shared by every path that can bring a product back from zero — the full edit
 * form (`UpdateProduct`) and the inline adjustment (`AdjustStock`). It lives here
 * rather than being copied into each because "a restock fulfils the waiting list"
 * is one rule, and two copies of it are two chances for one to be forgotten when
 * a third restock path appears.
 *
 * Best-effort by design: callers invoke this *after* the stock change has already
 * committed, so a notifier failure is logged rather than rethrown — a delivery
 * hiccup must never fail the admin's save, or worse, suggest the stock change
 * didn't happen when it did.
 */
export class FulfillStockAlerts {
  constructor(
    private readonly stockAlerts: IStockAlertRepository,
    private readonly notifier: IStockAlertNotifier,
  ) {}

  /**
   * Run when `product` crossed from out-of-stock to available. Callers decide
   * whether the crossing happened; this only acts on it.
   */
  async execute(product: Product): Promise<void> {
    try {
      const subscriberIds = await this.stockAlerts.listSubscriberIds(product.id);
      if (subscriberIds.length === 0) return;
      await this.notifier.notifyRestocked(product, subscriberIds);
      await this.stockAlerts.clearForProduct(product.id);
    } catch (error) {
      console.error(`Failed to fulfill stock alerts for product ${product.id}:`, error);
    }
  }
}
