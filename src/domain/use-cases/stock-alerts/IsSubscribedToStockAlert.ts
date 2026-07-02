import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";

/** Whether the user is subscribed to a product's back-in-stock alert. */
export class IsSubscribedToStockAlert {
  constructor(private readonly stockAlerts: IStockAlertRepository) {}

  async execute(userId: string, productId: string): Promise<boolean> {
    return this.stockAlerts.isSubscribed(userId, productId);
  }
}
