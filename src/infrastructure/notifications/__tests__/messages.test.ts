import { describe, expect, it } from "vitest";
import type { Order } from "@/src/domain/entities/Order";
import type { NotificationKind } from "@/src/domain/entities/Notification";
import type { NotificationTemplate, NotificationTemplateKind } from "@/src/domain/entities/NotificationTemplate";
import type { INotificationTemplateRepository } from "@/src/domain/repositories/INotificationTemplateRepository";
import { buildOrderMessage, type SubstitutionContext } from "../messages";

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "11112222-3333-4444-5555-666677778888",
    orderNumber: 1,
    userId: "user-1",
    status: "processing",
    phase: "current",
    deliveryType: "delivery",
    paymentStatus: "paid",
    placedAt: new Date().toISOString(),
    location: "Somewhere",
    subtotal: 100,
    shipping: 5,
    discount: 0,
    total: 105,
    taxAmount: null,
    taxRate: null,
    items: [],
    refunds: [],
    ...overrides,
  };
}

/** No row for any kind — every lookup falls through to the hardcoded switch. */
const noTemplates: INotificationTemplateRepository = {
  get: async () => null,
  list: async () => [],
  update: async () => {
    throw new Error("not used in this test");
  },
};

/** The exact seed the migration writes, converted to a lookup-by-kind repo. */
function seededTemplates(): INotificationTemplateRepository {
  const rows: Record<string, NotificationTemplate> = {
    order_confirmed: template(
      "order_confirmed",
      "Order confirmed",
      "Your FreshDrop order #{{ORDER}} is confirmed and being prepared{{WINDOW}}.",
    ),
    order_out_for_delivery: template(
      "order_out_for_delivery",
      "Out for delivery",
      "Your FreshDrop order #{{ORDER}} is out for delivery and on its way to you.",
    ),
    order_delivered: template("order_delivered", "Order delivered", "Your FreshDrop order #{{ORDER}} has been delivered. Enjoy!"),
    return_approved: template(
      "return_approved",
      "Return approved",
      "Your return for FreshDrop order #{{ORDER}} was approved and refunded to your wallet.",
    ),
    item_substituted: template(
      "item_substituted",
      "Item substituted",
      "{{ITEM}} was out of stock in your FreshDrop order #{{ORDER}}, so we swapped in {{REPLACEMENT}} as you approved. Any price difference was refunded to your wallet.",
    ),
    item_refunded: template(
      "item_refunded",
      "Item refunded",
      "{{ITEM}} was out of stock in your FreshDrop order #{{ORDER}}, so we removed it and refunded it to your wallet.",
    ),
    order_cancelled_out_of_stock: template(
      "order_cancelled_out_of_stock",
      "Order cancelled and refunded",
      "Every item in your FreshDrop order #{{ORDER}} was out of stock, so we cancelled it and refunded it in full — including the delivery fee — to your wallet.",
    ),
  };
  return {
    get: async (kind) => rows[kind] ?? null,
    list: async () => Object.values(rows),
    update: async () => {
      throw new Error("not used in this test");
    },
  };
}

function template(kind: NotificationTemplateKind, title: string, body: string): NotificationTemplate {
  return { kind, title, subject: null, body, updatedAt: new Date() };
}

const LIFECYCLE_KINDS: { kind: NotificationKind; context?: SubstitutionContext }[] = [
  { kind: "order_confirmed" },
  { kind: "order_out_for_delivery" },
  { kind: "order_delivered" },
  { kind: "return_approved" },
  { kind: "item_substituted", context: { itemName: "Milk", replacementName: "Oat milk" } },
  { kind: "item_refunded", context: { itemName: "Milk" } },
  { kind: "order_cancelled_out_of_stock" },
];

describe("buildOrderMessage — phase 2 fallback guarantee", () => {
  it.each(LIFECYCLE_KINDS)(
    "$kind: renders byte-identical title/body whether the seeded row exists or not, with a delivery window",
    async ({ kind, context }) => {
      const withWindow = order({ deliveryWindow: "Tomorrow, 6:00 – 8:00 PM" });
      const before = await buildOrderMessage(kind, withWindow, noTemplates, context);
      const after = await buildOrderMessage(kind, withWindow, seededTemplates(), context);

      expect(after.title).toBe(before.title);
      expect(after.body).toBe(before.body);
      expect(after.params).toEqual(before.params);
    },
  );

  it.each(LIFECYCLE_KINDS)(
    "$kind: renders byte-identical title/body with no delivery window",
    async ({ kind, context }) => {
      const noWindow = order({ deliveryWindow: undefined });
      const before = await buildOrderMessage(kind, noWindow, noTemplates, context);
      const after = await buildOrderMessage(kind, noWindow, seededTemplates(), context);

      expect(after.title).toBe(before.title);
      expect(after.body).toBe(before.body);
    },
  );
});
