import type { ActivityEntityType, ActivityAction, ActivityEntry } from "@/src/domain/entities/ActivityEntry";
import type { AdminNotification } from "@/src/domain/entities/AdminNotification";
import { PENDING_ORDER_SLA_HOURS, UNFULFILLED_ORDER_SLA_HOURS, slaCutoff } from "@/src/domain/entities/OrderSla";
import { MAX_PAGE_SIZE } from "@/src/domain/entities/Pagination";
import type { IActivityLog } from "@/src/domain/repositories/IActivityLog";
import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { IReviewRepository } from "@/src/domain/repositories/IReviewRepository";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/**
 * Which activity actions are worth surfacing in the bell.
 *
 * A curated subset of {@link ACTIVITY_ACTIONS}, not all of it: the log is a
 * complete audit trail (every catalog edit, every promo tweak), and the bell is
 * an operator inbox, not a mirror of `/dashboard/activity`. An entry earns a
 * place here when it's something a *different* admin than the one who made it
 * would want to be told about — a return resolved, a customer messaged, stock
 * corrected, a review moderated, or (owner-only, via `visibleEntityTypes`) a
 * teammate's access changing. Catalog/promo/delivery-window edits stay out:
 * they're routine and self-directed, and including them would bury the events
 * that actually need a look.
 */
const NOTIFICATION_ACTIVITY_ACTIONS: ReadonlySet<ActivityAction> = new Set([
  "order.returnResolved",
  "order.customerNotified",
  "review.moderated",
  "product.stockAdjusted",
  "user.roleChanged",
]);

/** How many notification-worthy entries the bell shows at most, per source. */
const ACTIVITY_FEED_LIMIT = 20;
const NOTIFICATIONS_FEED_LIMIT = 20;

/** Attention counts, computed the same way `NeedsAttentionPanel`'s tiles are. */
export type NotificationAttentionCounts = {
  pendingReviews: number;
  lowStock: number;
  staleOrders: number;
  staleOrdersCutoff: Date;
  overdueOrders: number;
  overdueOrdersCutoff: Date;
};

export type NotificationFeed = {
  /** Notification-worthy activity entries, newest first, capped at {@link ACTIVITY_FEED_LIMIT}. Bulk-dismiss only — no per-row storage to dismiss individually. */
  activity: ActivityEntry[];
  /**
   * How many of `activity`, in order, are newer than the viewer's last-seen
   * instant — the "first N are unread" a reader applies over the array, since
   * these rows carry no `readAt` of their own to check individually.
   */
  unreadActivityCount: number;
  /** The viewer's own stored notifications, newest first, capped at {@link NOTIFICATIONS_FEED_LIMIT}. Each carries its own `readAt` — unread is `readAt === null`, no index needed. */
  notifications: AdminNotification[];
  attention: NotificationAttentionCounts;
  /** The bell's badge total: `unreadActivityCount` plus unread `notifications`. */
  unreadCount: number;
};

/**
 * Assemble the notification bell's feed from three sources:
 *
 *  - a filtered read of the activity log (see {@link NOTIFICATION_ACTIVITY_ACTIONS}) —
 *    bulk-mark-read only, via the viewer's `lastSeenNotificationsAt`;
 *  - the viewer's own stored notifications (see `AdminNotification`) — the
 *    customer-initiated events the log structurally can't hold, dismissable
 *    one row at a time;
 *  - the same "needs attention" counts the dashboard overview already computes.
 *
 * Reads the counts straight off the repositories rather than over HTTP (unlike
 * the dashboard overview's own server component), because this runs inside a
 * route handler, not a Server Component with a BFF to call through.
 */
export class GetNotificationFeed {
  constructor(
    private readonly activityLog: IActivityLog,
    private readonly adminNotifications: IAdminNotificationRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    viewerId: string,
    visibleEntityTypes: readonly ActivityEntityType[] | undefined,
    now: Date = new Date(),
  ): Promise<NotificationFeed> {
    const staleOrdersCutoff = slaCutoff(PENDING_ORDER_SLA_HOURS, now);
    const overdueOrdersCutoff = slaCutoff(UNFULFILLED_ORDER_SLA_HOURS, now);

    const [
      logPage,
      storedNotifications,
      unreadStoredCount,
      pendingReviews,
      needsRestock,
      staleOrders,
      overdueOrders,
      lastSeenNotificationsAt,
    ] = await Promise.all([
      // Read at the widest page size, then narrow to the allowlist below: the
      // log's own filter takes one `action`, not a set, so the notification-
      // worthy subset is picked out here rather than in the query.
      this.activityLog.list({ visibleEntityTypes }, { page: 1, pageSize: MAX_PAGE_SIZE }),
      this.adminNotifications.listForUser(viewerId, NOTIFICATIONS_FEED_LIMIT),
      this.adminNotifications.countUnread(viewerId),
      this.reviewRepository.listPage({ status: "pending" }, { page: 1, pageSize: 1 }),
      this.productRepository.listPage({ stock: "needsRestock" }, { page: 1, pageSize: 1 }),
      this.orderRepository.listPage(
        { pipeline: "pending", placedTo: staleOrdersCutoff.toISOString() },
        { page: 1, pageSize: 1 },
      ),
      this.orderRepository.listPage(
        { pipeline: "in_progress", placedTo: overdueOrdersCutoff.toISOString() },
        { page: 1, pageSize: 1 },
      ),
      this.userRepository.getLastSeenNotificationsAt(viewerId),
    ]);

    const activity = logPage.items
      .filter((entry) => NOTIFICATION_ACTIVITY_ACTIONS.has(entry.action))
      .slice(0, ACTIVITY_FEED_LIMIT);

    const unreadActivityCount = activity.filter(
      (entry) => !lastSeenNotificationsAt || entry.at > lastSeenNotificationsAt,
    ).length;

    return {
      activity,
      unreadActivityCount,
      notifications: storedNotifications,
      attention: {
        pendingReviews: pendingReviews.total,
        lowStock: needsRestock.total,
        staleOrders: staleOrders.total,
        staleOrdersCutoff,
        overdueOrders: overdueOrders.total,
        overdueOrdersCutoff,
      },
      unreadCount: unreadActivityCount + unreadStoredCount,
    };
  }
}
