/**
 * A transactional notification the app sends a customer about their order — the
 * lifecycle moments a delivery app must surface. Channel-agnostic: the same
 * message is fanned out to SMS, push, etc. (see {@link INotificationChannel}).
 *
 * - `order_confirmed` — the order was placed and is being prepared.
 * - `order_out_for_delivery` — the courier has the order and is on the way.
 * - `order_delivered` — the order reached the destination.
 * - `return_approved` — an admin approved the customer's return and refunded it.
 * - `item_substituted` — a picker replaced an out-of-stock line with a pre-approved
 *   comparable item.
 * - `item_refunded` — a picker dropped an out-of-stock line the customer chose not
 *   to substitute and refunded it.
 * - `order_cancelled_out_of_stock` — every line was out of stock and refunded, so
 *   the order was cancelled and fully refunded (delivery fee included).
 */
export type NotificationKind =
  | "order_confirmed"
  | "order_out_for_delivery"
  | "order_delivered"
  | "return_approved"
  | "item_substituted"
  | "item_refunded"
  | "order_cancelled_out_of_stock";

/**
 * A rendered, channel-agnostic notification. `title`/`body` are the human copy
 * used by free-text channels (push, logging, bulk SMS); `params` carries the
 * same facts as named values for template-based channels (SMS.ir pattern
 * templates fill their approved template from these). One `NotificationMessage`
 * therefore serves every channel without any of them re-deriving the copy.
 */
export type NotificationMessage = {
  kind: NotificationKind;
  /** Short headline, e.g. "Order out for delivery". */
  title: string;
  /** One-line body, e.g. "Your FreshDrop order #ab12cd is on its way." */
  body: string;
  /** The order this notification is about. */
  orderId: string;
  /**
   * Named facts for template channels (e.g. `{ ORDER: "ab12cd", WINDOW: "…" }`).
   * Keys match the parameter names in the channel's approved template.
   */
  params: Record<string, string>;
};

/**
 * Who a notification is going to. Resolved from the order's owner before
 * dispatch. `phone` is nullable because a channel that needs it (SMS) simply
 * skips a recipient without one — a missing contact is never an error.
 */
export type NotificationRecipient = {
  userId: string;
  phone: string | null;
  name: string;
};
