import type { Order } from "@/src/domain/entities/Order";
import type { NotificationKind, NotificationMessage } from "@/src/domain/entities/Notification";
import { orderConfirmedRenderVars, shortOrderRef } from "@/src/domain/entities/NotificationTemplate";
import type { INotificationTemplateRepository } from "@/src/domain/repositories/INotificationTemplateRepository";
import { render } from "@/src/lib/renderTemplate";

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
 * `params` (the same facts, named).
 *
 * Store-then-fallback (phase 2): if an admin-editable `NotificationTemplate`
 * row exists for `kind`, its `title`/`body` are rendered from `renderVars` and
 * used instead of the hardcoded copy below; a missing row falls through to
 * the hardcoded switch unchanged. `params` — what the SMS pattern-template
 * channel fills its own approved template from — is unaffected either way;
 * only the free-text `title`/`body` are template-editable.
 *
 * `renderVars` differs from `params` for `order_confirmed`: its `WINDOW` is
 * the whole " for delivery {window}" clause (or "" with no window), not the
 * raw window value, because the hardcoded copy makes that clause conditional
 * on the order having one. Reproducing that with a straight `{{VAR}}`
 * substitution needs the conditional baked into the value, not the template.
 */
export async function buildOrderMessage(
  kind: NotificationKind,
  order: Order,
  templateRepo: INotificationTemplateRepository,
  context?: SubstitutionContext,
): Promise<NotificationMessage> {
  const ref = shortOrderRef(order.id);
  const window = order.deliveryWindow ?? "";
  const itemName = context?.itemName ?? "";
  const replacementName = context?.replacementName ?? "";

  const fallback = fallbackMessage(kind, order, ref, window, itemName, replacementName);
  const renderVars = renderVarsFor(kind, order, ref, window, itemName, replacementName);

  const template = await templateRepo.get(kind);
  if (!template) return fallback;

  return {
    ...fallback,
    title: template.title != null ? render(template.title, renderVars) : fallback.title,
    body: render(template.body, renderVars),
  };
}

/** The named facts passed to `render()` for a kind's title/body template. */
function renderVarsFor(
  kind: NotificationKind,
  order: Order,
  ref: string,
  window: string,
  itemName: string,
  replacementName: string,
): Record<string, string> {
  switch (kind) {
    case "order_confirmed":
      return orderConfirmedRenderVars(order);
    case "order_out_for_delivery":
      return { ORDER: ref, WINDOW: window };
    case "order_delivered":
    case "return_approved":
    case "order_cancelled_out_of_stock":
      return { ORDER: ref };
    case "item_substituted":
      return { ORDER: ref, ITEM: itemName, REPLACEMENT: replacementName };
    case "item_refunded":
      return { ORDER: ref, ITEM: itemName };
  }
}

/**
 * The ad hoc customer-message form's starting subject/body (phase 4) —
 * `message_default`'s copy, rendered with this order's facts. Store-then-
 * fallback like {@link buildOrderMessage}: a missing row falls back to the
 * feature's stated first-time value (a generic subject, an empty body) so
 * the form never fails to render, it's just unhelpfully blank.
 */
export async function buildCustomMessageDefault(
  order: Order,
  templateRepo: INotificationTemplateRepository,
): Promise<{ subject: string; body: string }> {
  const renderVars = orderConfirmedRenderVars(order);
  const fallback = { subject: "Update on your order", body: "" };

  const template = await templateRepo.get("message_default");
  if (!template) return fallback;

  return {
    subject: template.subject != null ? render(template.subject, renderVars) : fallback.subject,
    body: render(template.body, renderVars),
  };
}

/** The hardcoded copy — the fallback used when a kind has no template row. */
function fallbackMessage(
  kind: NotificationKind,
  order: Order,
  ref: string,
  window: string,
  itemName: string,
  replacementName: string,
): NotificationMessage {
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
