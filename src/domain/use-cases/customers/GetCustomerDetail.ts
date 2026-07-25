import type { CustomerDetail, CustomerLifetime } from "../../entities/CustomerDetail";
import { orderRecognizedRevenue, type Order } from "../../entities/Order";
import { toPublicReview } from "../../entities/Review";
import { NotFoundError } from "../../errors/NotFoundError";
import type { IDeliveryLocationRepository } from "../../repositories/IDeliveryLocationRepository";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IReviewRepository } from "../../repositories/IReviewRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import type { IWalletRepository } from "../../repositories/IWalletRepository";

/**
 * Assemble everything the dashboard shows about one customer. Backs
 * `GET /api/admin/customers/[id]`. A cross-user read — every repository call here
 * reaches into data belonging to someone other than the caller, so gate the caller
 * to admins.
 *
 * Five reads, all keyed by the same user id and none depending on another's result,
 * so they go out together. Each is already the narrow per-user query its repository
 * was built around (`getOrders`, `getByUser`, `getWallet`, `listByAuthor`) — this
 * page never reads a whole table, unlike the customers *list* it's reached from,
 * which still aggregates the full order history to rank everyone.
 *
 * Absence is not an error on its own: a customer with a profile but no orders is
 * perfectly normal (they signed up and haven't bought yet), and so is a customer
 * with orders but no profile (seed and demo orders reference ids that were never
 * signed up). Only *neither* means the id names nobody.
 */
export class GetCustomerDetail {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly addressRepo: IDeliveryLocationRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly reviewRepo: IReviewRepository,
  ) {}

  async execute(userId: string): Promise<CustomerDetail> {
    const [user, orders, addresses, wallet, reviews] = await Promise.all([
      this.userRepo.getById(userId),
      this.orderRepo.getOrders(userId),
      this.addressRepo.getByUser(userId),
      this.walletRepo.getWallet(userId),
      this.reviewRepo.listByAuthor(userId),
    ]);

    if (!user && orders.length === 0) {
      throw new NotFoundError("customer", userId);
    }

    return {
      userId,
      name: user?.name ?? userId,
      phone: user?.phone ?? "",
      email: user?.email ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      role: user?.role ?? "customer",
      hasProfile: user != null,
      lifetime: summarizeLifetime(orders),
      orders,
      addresses,
      wallet,
      reviews: reviews.map(toPublicReview),
    };
  }
}

/**
 * Reduce a customer's orders to their lifetime figures.
 *
 * Spend is {@link orderRecognizedRevenue}, matching `GetCustomerOrderSummaries` —
 * a cancelled or returned order was credited back and an out-of-stock line was
 * refunded, so neither is money this customer actually spent. Keeping the two in
 * agreement matters here in particular: this page is reached from the list that
 * ranks by that figure, and the two disagreeing would read as a bug.
 *
 * `orderCount` stays every order placed — that's their history, independent of what
 * came back — which does mean `averageOrderValue` is spend per order *placed*, the
 * useful reading of it.
 */
function summarizeLifetime(orders: readonly Order[]): CustomerLifetime {
  if (orders.length === 0) {
    return {
      orderCount: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      firstOrderAt: null,
      lastOrderAt: null,
    };
  }

  let totalSpent = 0;
  // `placedAt` is a fixed-format ISO UTC string, so a lexicographic compare is also
  // chronological. Scanned rather than read off the ends of the array: the repo
  // orders newest first today, but a lifetime figure shouldn't depend on that.
  let firstOrderAt = orders[0].placedAt;
  let lastOrderAt = orders[0].placedAt;

  for (const order of orders) {
    totalSpent += orderRecognizedRevenue(order, order.refunds);
    if (order.placedAt < firstOrderAt) firstOrderAt = order.placedAt;
    if (order.placedAt > lastOrderAt) lastOrderAt = order.placedAt;
  }

  return {
    orderCount: orders.length,
    totalSpent,
    averageOrderValue: totalSpent / orders.length,
    firstOrderAt,
    lastOrderAt,
  };
}
