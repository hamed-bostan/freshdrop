import type { Permission } from "./Permission";

/**
 * Stored, per-admin notifications — the half of the bell's feed the activity
 * log structurally can't hold.
 *
 * `ActivityEntry` records changes *staff* make; these four are the customer-
 * (or self-) initiated events that never produce one: nobody audits a shopper
 * placing an order, requesting a return, or leaving a review, and a stock
 * adjustment already gets its own `product.stockAdjusted` entry regardless of
 * whether the result happened to be zero. See `GetNotificationFeed` for how
 * this merges with the activity-log-derived half of the feed.
 *
 * Named `AdminNotification`, not `Notification`: that name already belongs to
 * the outbound, customer-facing order message (`NotificationMessage`) — a
 * different concept, fanning out to a different audience over different
 * channels. This is its own, unrelated inbound record.
 */
export const ADMIN_NOTIFICATION_ACTIONS = [
  "order.placed",
  "order.returnRequested",
  "review.submitted",
  "product.stockDepleted",
] as const;

export type AdminNotificationAction = (typeof ADMIN_NOTIFICATION_ACTIONS)[number];

/** Narrow an arbitrary stored string to a known action, falling back to `unknown`. */
export function toAdminNotificationAction(value: string): AdminNotificationAction | "unknown" {
  return (ADMIN_NOTIFICATION_ACTIONS as readonly string[]).includes(value)
    ? (value as AdminNotificationAction)
    : "unknown";
}

/**
 * The permission that gates *receiving* each category — the same one
 * `NotifyAdmins` resolves recipients by. Lets the preferences panel (Track
 * B3) offer only the toggles a viewer could ever actually be fanned into;
 * offering "email me about returns" to someone who can never receive a
 * `order.returnRequested` row in the first place would be a setting with no
 * effect and no way to tell.
 */
export const ADMIN_NOTIFICATION_PERMISSIONS: Record<AdminNotificationAction, Permission> = {
  "order.placed": "orders.fulfill",
  "order.returnRequested": "orders.fulfill",
  "review.submitted": "reviews.moderate",
  "product.stockDepleted": "catalog.write",
};

/**
 * One admin's copy of an event. Fanned out at write time — see
 * {@link NewAdminNotification} and `NotifyAdmins` — so `userId` names a real
 * recipient rather than a visibility rule to apply at read time.
 */
export type AdminNotification = {
  id: string;
  userId: string;
  action: AdminNotificationAction | "unknown";
  entityType: string;
  entityId: string;
  entityLabel?: string;
  /**
   * Who/what triggered it — the customer for order/review events, the admin
   * for a manual stock adjustment. Absent when there's no single actor to name.
   */
  actorId?: string;
  actorName?: string;
  createdAt: Date;
  /** `null` = unread. Set once the recipient dismisses it (or "mark all read"). */
  readAt: Date | null;
};

/**
 * A notification about to be recorded, for one recipient.
 *
 * `action` is narrower here than on {@link AdminNotification}: `"unknown"` is
 * a fallback for *reading back* a stored value this build doesn't recognise
 * (a renamed or retired category), never something a caller constructs fresh.
 */
export type NewAdminNotification = Omit<AdminNotification, "id" | "createdAt" | "readAt" | "action"> & {
  action: AdminNotificationAction;
};
