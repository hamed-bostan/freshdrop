import { orderRecognizedRevenue } from "../../entities/Order";
import type { CustomerOrderSummary } from "../../entities/CustomerOrderSummary";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";

/** Running totals accumulated for one customer while scanning the order history. */
type CustomerStats = {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

/**
 * Aggregate the whole order history into a per-customer summary ranked by total
 * spend (highest first) — the admin dashboard's "top customers" view, and the
 * source of the customer label on each order row. A cross-user read: gate the
 * caller to admins.
 */
export class GetCustomerOrderSummaries {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(): Promise<CustomerOrderSummary[]> {
    const orders = await this.orderRepo.getAllOrders();

    // Group orders by the user who placed them, accumulating count, spend and the
    // most recent order date. `placedAt` is a fixed-format ISO UTC string, so a
    // lexicographic compare is also chronological.
    //
    // Spend is `orderRecognizedRevenue`, not the raw `total`: an order that was
    // cancelled or returned had its total credited back, and a partially
    // out-of-stock one was refunded per line, so neither is money this customer
    // actually spent. This is also what every order row displays, so the ranking
    // agrees with the figures beside it. `orderCount` stays every order placed —
    // that's their history, independent of what was refunded.
    const byUser = new Map<string, CustomerStats>();
    for (const order of orders) {
      const spent = orderRecognizedRevenue(order);
      const stats = byUser.get(order.userId);
      if (stats) {
        stats.orderCount += 1;
        stats.totalSpent += spent;
        if (order.placedAt > stats.lastOrderAt) stats.lastOrderAt = order.placedAt;
      } else {
        byUser.set(order.userId, {
          orderCount: 1,
          totalSpent: spent,
          lastOrderAt: order.placedAt,
        });
      }
    }

    // Resolve each customer's profile for a human label. Missing user rows (e.g.
    // seed/demo orders whose userId has no profile) fall back to the raw id so the
    // row still renders.
    const userIds = [...byUser.keys()];
    const users = await Promise.all(userIds.map((id) => this.userRepo.getById(id)));

    const summaries: CustomerOrderSummary[] = userIds.map((userId, index) => {
      const stats = byUser.get(userId)!;
      const user = users[index];
      return {
        userId,
        name: user?.name ?? userId,
        phone: user?.phone ?? "",
        email: user?.email ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderAt: stats.lastOrderAt,
        // Replaced below, once the list is ranked.
        rank: 0,
      };
    });

    // Rank by total spend, highest first — the "most buying" ordering — and stamp
    // each summary with its position here, while the list is still complete. A
    // rank assigned later couldn't survive a search or a page boundary.
    return summaries
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((summary, index) => ({ ...summary, rank: index + 1 }));
  }
}
