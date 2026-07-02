import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import { NotFoundError } from "../../errors/NotFoundError";

/**
 * Register the user to be notified when a product is back in stock. The product
 * must exist; subscribing is idempotent. We don't reject an in-stock product — a
 * subscription simply waits for the next 0 → in-stock transition, which is exactly
 * "tell me when it's available again".
 */
export class SubscribeToStockAlert {
  constructor(
    private readonly stockAlerts: IStockAlertRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    const product = await this.productRepo.getById(productId);
    if (!product) throw new NotFoundError("product", productId);

    await this.stockAlerts.subscribe(userId, productId);
  }
}
