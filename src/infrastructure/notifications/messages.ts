import type { Order } from "@/src/domain/entities/Order";
import type { NotificationKind, NotificationMessage } from "@/src/domain/entities/Notification";

/**
 * The short, human-facing order reference used in notification copy — the head of
 * the uuid, uppercased (e.g. `AB12CD`). Enough to identify the order in an SMS
 * without dumping a full uuid on the customer.
 */
function shortRef(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

/**
 * Extra facts a substitution message needs — the affected line's name and, for a
 * swap, the replacement's name. Ignored by the order-lifecycle kinds.
 */
export type SubstitutionContext = {
  itemName: string;
  replacementName?: string;
};

/**
 * Map an order lifecycle event to a rendered, channel-agnostic
 * {@link NotificationMessage}. The single owner of notification copy: free-text
 * channels use `title`/`body`, template channels fill their template from
 * `params` (the same facts, named). Pure — no I/O, no channel knowledge.
 */
export function buildOrderMessage(
  kind: NotificationKind,
  order: Order,
  context?: SubstitutionContext,
): NotificationMessage {
  const ref = shortRef(order.id);
  const window = order.deliveryWindow ?? "";
  const itemName = context?.itemName ?? "";
  const replacementName = context?.replacementName ?? "";

  switch (kind) {
    case "order_confirmed":
      return {
        kind,
        orderId: order.id,
        title: "Order confirmed",
        body: `Your FreshDrop order #${ref} is confirmed and being prepared${
          window ? ` for delivery ${window}` : ""
        }.`,
        params: { ORDER: ref, WINDOW: window },
      };
    case "order_out_for_delivery":
      return {
        kind,
        orderId: order.id,
        title: "Out for delivery",
        body: `Your FreshDrop order #${ref} is out for delivery and on its way to you.`,
        params: { ORDER: ref, WINDOW: window },
      };
    case "order_delivered":
      return {
        kind,
        orderId: order.id,
        title: "Order delivered",
        body: `Your FreshDrop order #${ref} has been delivered. Enjoy!`,
        params: { ORDER: ref },
      };
    case "return_approved":
      return {
        kind,
        orderId: order.id,
        title: "Return approved",
        body: `Your return for FreshDrop order #${ref} was approved and refunded to your wallet.`,
        params: { ORDER: ref },
      };
    case "item_substituted":
      return {
        kind,
        orderId: order.id,
        title: "Item substituted",
        body: `${itemName} was out of stock in your FreshDrop order #${ref}, so we swapped in ${replacementName} as you approved. Any price difference was refunded to your wallet.`,
        params: { ORDER: ref, ITEM: itemName, REPLACEMENT: replacementName },
      };
    case "item_refunded":
      return {
        kind,
        orderId: order.id,
        title: "Item refunded",
        body: `${itemName} was out of stock in your FreshDrop order #${ref}, so we removed it and refunded it to your wallet.`,
        params: { ORDER: ref, ITEM: itemName },
      };
    case "order_cancelled_out_of_stock":
      return {
        kind,
        orderId: order.id,
        title: "Order cancelled and refunded",
        body: `Every item in your FreshDrop order #${ref} was out of stock, so we cancelled it and refunded it in full — including the delivery fee — to your wallet.`,
        params: { ORDER: ref },
      };
  }
}
