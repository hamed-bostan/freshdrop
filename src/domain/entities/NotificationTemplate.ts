/**
 * Everything editable copy in the app is keyed by: the 7 order-lifecycle
 * notifications, the 4 admin-alert email categories, and one more —
 * `message_default`, the ad hoc customer-message form's starting subject/body
 * (see `OrderCommsPanel`, phase 4). All three are "copy keyed by an event
 * name," one shape, one table.
 */
export const NOTIFICATION_TEMPLATE_KINDS = [
  "order_confirmed",
  "order_out_for_delivery",
  "order_delivered",
  "return_approved",
  "item_substituted",
  "item_refunded",
  "order_cancelled_out_of_stock",
  "order.placed",
  "order.returnRequested",
  "review.submitted",
  "product.stockDepleted",
  "message_default",
] as const;

export type NotificationTemplateKind = (typeof NOTIFICATION_TEMPLATE_KINDS)[number];

/**
 * Which free-text field a kind's copy lives in: the 7 lifecycle kinds are
 * push/SMS-style (`title` + `body`); the 4 admin-alert kinds and
 * `message_default` are email-style (`subject` + `body`).
 */
export type NotificationTemplateChannel = "push" | "email";

export const NOTIFICATION_TEMPLATE_CHANNEL: Record<NotificationTemplateKind, NotificationTemplateChannel> = {
  order_confirmed: "push",
  order_out_for_delivery: "push",
  order_delivered: "push",
  return_approved: "push",
  item_substituted: "push",
  item_refunded: "push",
  order_cancelled_out_of_stock: "push",
  "order.placed": "email",
  "order.returnRequested": "email",
  "review.submitted": "email",
  "product.stockDepleted": "email",
  message_default: "email",
};

/**
 * The `{{VAR}}` names each kind's copy may reference — the allowlist
 * `UpdateNotificationTemplate` validates against (phase 3), so a template
 * can't reference a variable that will never be filled at send time.
 *
 * `order_confirmed`'s `WINDOW` is not the raw delivery-window string: it's
 * the whole " for delivery {window}" clause (or "" when there's no window),
 * because the original hardcoded copy makes that clause conditional on the
 * order having one. Every other kind's vars are the plain named fact.
 */
export const NOTIFICATION_TEMPLATE_VARS: Record<NotificationTemplateKind, readonly string[]> = {
  order_confirmed: ["ORDER", "WINDOW"],
  order_out_for_delivery: ["ORDER", "WINDOW"],
  order_delivered: ["ORDER"],
  return_approved: ["ORDER"],
  item_substituted: ["ORDER", "ITEM", "REPLACEMENT"],
  item_refunded: ["ORDER", "ITEM"],
  order_cancelled_out_of_stock: ["ORDER"],
  "order.placed": ["LABEL"],
  "order.returnRequested": ["LABEL"],
  "review.submitted": [],
  "product.stockDepleted": ["LABEL"],
  message_default: ["ORDER", "WINDOW"],
};

/** One kind's editable copy. `title`/`subject` are null unless the kind's channel uses them. */
export type NotificationTemplate = {
  kind: NotificationTemplateKind;
  title: string | null;
  subject: string | null;
  body: string;
  updatedAt: Date;
};

/**
 * The short, human-facing order reference used in notification copy — the head
 * of the uuid, uppercased (e.g. `AB12CD`). Framework-free, so both the infra
 * notifier (`buildOrderMessage`) and a domain use-case (`GetOrderMessageDefault`)
 * can share it without either depending on the other's layer.
 */
export function shortOrderRef(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

/**
 * The `{{VAR}}` render vars for `order_confirmed` and `message_default` — the
 * two kinds whose `WINDOW` is the whole " for delivery {window}" clause (or
 * "" with no window), not the raw window value. See those kinds' entries in
 * `NOTIFICATION_TEMPLATE_VARS` for why.
 */
export function orderConfirmedRenderVars(order: { id: string; deliveryWindow?: string }): Record<string, string> {
  const window = order.deliveryWindow ?? "";
  return { ORDER: shortOrderRef(order.id), WINDOW: window ? ` for delivery ${window}` : "" };
}
