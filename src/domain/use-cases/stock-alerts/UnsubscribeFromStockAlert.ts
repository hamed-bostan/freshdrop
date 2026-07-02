import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";

/** Cancel a user's back-in-stock subscription for a product. Idempotent. */
export class UnsubscribeFromStockAlert {
  constructor(private readonly stockAlerts: IStockAlertRepository) {}

  async execute(userId: string, productId: string): Promise<void> {
    await this.stockAlerts.unsubscribe(userId, productId);
  }
}
