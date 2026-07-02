import type { Product } from "@/src/domain/entities/Product";
import type { IStockAlertNotifier } from "@/src/domain/repositories/IStockAlertNotifier";

/**
 * A placeholder notifier that logs restock notifications server-side instead of
 * delivering them. It stands in until a real channel (email/SMS/push) is wired —
 * the container binds this behind `IStockAlertNotifier`, so swapping in a real
 * implementation is a one-line change and no use-case is touched.
 */
export class LoggingStockAlertNotifier implements IStockAlertNotifier {
  async notifyRestocked(product: Product, userIds: readonly string[]): Promise<void> {
    if (userIds.length === 0) return;
    console.info(
      `[stock-alert] "${product.name}" (${product.id}) is back in stock — notifying ${userIds.length} subscriber(s):`,
      userIds,
    );
  }
}
