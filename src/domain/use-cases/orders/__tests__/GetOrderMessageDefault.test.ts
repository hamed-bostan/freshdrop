import { describe, expect, it } from "vitest";
import { GetOrderMessageDefault } from "../GetOrderMessageDefault";
import type { Order } from "@/src/domain/entities/Order";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { INotificationTemplateRepository } from "@/src/domain/repositories/INotificationTemplateRepository";
import type { NotificationTemplate } from "@/src/domain/entities/NotificationTemplate";

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
    walletApplied: 0,
    refunds: [],
    ...overrides,
  };
}

function orderRepo(found: Order | null): IOrderRepository {
  return { getById: async () => found } as unknown as IOrderRepository;
}

const noTemplates: INotificationTemplateRepository = {
  get: async () => null,
  list: async () => [],
  update: async () => {
    throw new Error("not used in this test");
  },
};

function templateRepoWith(row: NotificationTemplate): INotificationTemplateRepository {
  return {
    get: async (kind) => (kind === row.kind ? row : null),
    list: async () => [row],
    update: async () => {
      throw new Error("not used in this test");
    },
  };
}

describe("GetOrderMessageDefault", () => {
  it("falls back to the feature's stated first-time value when no template row exists", async () => {
    const result = await new GetOrderMessageDefault(orderRepo(order()), noTemplates).execute("order-1");
    expect(result).toEqual({ subject: "Update on your order", body: "" });
  });

  it("renders the seeded template with the order's ORDER/WINDOW", async () => {
    const row: NotificationTemplate = {
      kind: "message_default",
      title: null,
      subject: "Update on order #{{ORDER}}",
      body: "Hi — a note about your order{{WINDOW}}.",
      updatedAt: new Date(),
    };
    const result = await new GetOrderMessageDefault(
      orderRepo(order({ deliveryWindow: "Tomorrow, 6:00 – 8:00 PM" })),
      templateRepoWith(row),
    ).execute("order-1");

    expect(result).toEqual({
      subject: "Update on order #111122",
      body: "Hi — a note about your order for delivery Tomorrow, 6:00 – 8:00 PM.",
    });
  });

  it("throws NotFoundError for a missing order", async () => {
    await expect(new GetOrderMessageDefault(orderRepo(null), noTemplates).execute("missing")).rejects.toThrow();
  });
});
