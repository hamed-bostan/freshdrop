import type { AdminNotificationAction, NewAdminNotification } from "@/src/domain/entities/AdminNotification";
import type { Permission } from "@/src/domain/entities/Permission";
import { roleHasPermission } from "@/src/domain/entities/Permission";
import { DASHBOARD_ROLES } from "@/src/domain/entities/User";
import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";
import type { IEmailSender } from "@/src/domain/repositories/IEmailSender";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

/** Plain-English email copy per category — the same un-i18n'd, internal-ops style `TeamNotifier` already uses. */
const EMAIL_COPY: Record<AdminNotificationAction, (label: string) => { subject: string; text: string }> = {
  "order.placed": (label) => ({
    subject: "New order placed",
    text: `A new order was placed: ${label}.\n\nOpen it from the dashboard's Orders list.`,
  }),
  "order.returnRequested": (label) => ({
    subject: "Return requested",
    text: `A customer requested a return on order ${label}.\n\nApprove or reject it from the dashboard's Orders list.`,
  }),
  "review.submitted": () => ({
    subject: "New review awaiting moderation",
    text: "A new review was submitted and is awaiting moderation.\n\nReview it from the dashboard's Reviews queue.",
  }),
  "product.stockDepleted": (label) => ({
    subject: "Product out of stock",
    text: `${label} just ran out of stock.\n\nRestock it from the dashboard's Products list.`,
  }),
};

/**
 * Fan a notification out to every dashboard user holding `permission` — the
 * recipient resolution the bell's stored notifications need (see
 * `AdminNotification`) — and, where a recipient has opted in (see
 * `User.notifiedCategories`), email them too. This is the one place the
 * inbound bell and the outbound `IEmailSender` meet (Track B3).
 *
 * Permission-based rather than role-based, matching every other guard in this
 * app: a caller says *who should hear about this* ("orders.fulfill",
 * "reviews.moderate"), not which roles that happens to be today, so a future
 * role addition or permission change is honoured automatically.
 *
 * Called *after* the triggering write has already committed (an order placed,
 * a return requested, a review submitted, a stock adjustment applied) —
 * best-effort, the same standing `orderNotifier`/`teamNotifier` already have.
 * A failed fan-out must never undo, or fail the request for, a change that has
 * already happened.
 */
export class NotifyAdmins {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: IAdminNotificationRepository,
    private readonly emailSender: IEmailSender,
  ) {}

  /**
   * `excludeUserId` drops one recipient from the fan-out — for the one trigger
   * where the actor can also be a recipient (an admin adjusting their own
   * catalog's stock to zero): they were just there, they don't need telling.
   * The other triggers are customer-initiated, so it's never set there.
   */
  async execute(
    permission: Permission,
    notification: Omit<NewAdminNotification, "userId">,
    excludeUserId?: string,
  ): Promise<void> {
    try {
      const roles = DASHBOARD_ROLES.filter((role) => roleHasPermission(role, permission));
      const recipients = await this.userRepository.listByRoles(roles);
      const label = notification.entityLabel ?? notification.entityId;

      await Promise.all(
        recipients
          .filter((user) => user.id !== excludeUserId)
          .map(async (user) => {
            await this.notificationRepository.create({ ...notification, userId: user.id });

            // Opt-in only, and only when there's an address on file — the same
            // "skip a channel it can't reach rather than fail" standing every
            // outbound notifier here has.
            if (user.email && user.notifiedCategories.includes(notification.action)) {
              const { subject, text } = EMAIL_COPY[notification.action](label);
              await this.emailSender.send({ to: user.email, subject, text });
            }
          }),
      );
    } catch (error) {
      console.error("[NOTIFY_ADMINS_FAILED]", permission, JSON.stringify(notification), error);
    }
  }
}
