import { describe, expect, it, vi } from "vitest";
import type { ActivityActor } from "../../../entities/ActivityEntry";
import type { Order, OrderItem } from "../../../entities/Order";
import type { NewRefund, IRefundRepository } from "../../../repositories/IRefundRepository";
import type { IOrderRepository, OrderStatusTransition } from "../../../repositories/IOrderRepository";
import type { IProductRepository } from "../../../repositories/IProductRepository";
import type { IWalletRepository } from "../../../repositories/IWalletRepository";
import type { IUnitOfWork, TransactionalRepositories } from "../../../repositories/IUnitOfWork";
import type { IOrderNotifier } from "../../../repositories/IOrderNotifier";
import type { IDeliverySlotRepository } from "../../../repositories/IDeliverySlotRepository";
import { CancelOrder } from "../CancelOrder";
import { ResolveOrderReturn } from "../ResolveOrderReturn";
import { ResolveItemSubstitution } from "../ResolveItemSubstitution";

/** Throws for any method not explicitly overridden — keeps each fake to just what a test exercises. */
function stub<T extends object>(overrides: Partial<T>): T {
  return new Proxy(overrides as Record<PropertyKey, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {
        throw new Error(`not implemented: ${String(prop)}`);
      };
    },
  }) as T;
}

function item(overrides: Partial<OrderItem> & Pick<OrderItem, "id" | "productId">): OrderItem {
  return {
    name: "Item",
    imageUrl: "",
    quantity: 1,
    price: 100,
    substitutionPreference: "refund",
    taxExempt: false,
    taxAmount: null,
    ...overrides,
  };
}

function order(overrides: Partial<Order> & Pick<Order, "items">): Order {
  return {
    id: "order-1",
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
    stage: "confirmed",
    ...overrides,
  };
}

const notifier = stub<IOrderNotifier>({
  returnApproved: vi.fn(async () => {}),
  itemSubstituted: vi.fn(async () => {}),
  itemRefunded: vi.fn(async () => {}),
  orderCancelledOutOfStock: vi.fn(async () => {}),
});

const products = stub<IProductRepository>({
  incrementStock: vi.fn(async () => {}),
  decrementStock: vi.fn(async () => {}),
});

function uowOf(repos: Partial<TransactionalRepositories>): IUnitOfWork {
  return {
    run: (work) =>
      work({
        orders: repos.orders ?? stub<IOrderRepository>({}),
        products: repos.products ?? products,
        wallets: repos.wallets ?? stub<IWalletRepository>({}),
        slots: repos.slots ?? stub<IDeliverySlotRepository>({}),
        refunds: repos.refunds ?? stub<IRefundRepository>({}),
      }),
  };
}

function fakeRefunds() {
  const record = vi.fn(async (refund: NewRefund) => ({
    ...refund,
    id: "refund-1",
    createdAt: new Date().toISOString(),
  }));
  return stub<IRefundRepository>({ record, listForOrder: vi.fn(async () => []) });
}

describe("CancelOrder", () => {
  it("records a cancellation refund alongside the wallet credit", async () => {
    const placed = order({ items: [item({ id: "item-1", productId: "p1", taxAmount: 10 })], taxAmount: 10, taxRate: 10 });
    const addFunds = vi.fn(async () => {});
    const refunds = fakeRefunds();
    const orders = stub<IOrderRepository>({
      getById: vi.fn(async () => placed),
      transitionStatus: vi.fn(async (_id: string, transition: OrderStatusTransition) => ({
        ...placed,
        status: transition.to.status,
        phase: transition.to.phase ?? placed.phase,
        stage: transition.to.stage === null ? undefined : (transition.to.stage ?? placed.stage),
        paymentStatus: transition.to.paymentStatus ?? placed.paymentStatus,
      })),
    });
    const wallets = stub<IWalletRepository>({ addFunds });

    const useCase = new CancelOrder(orders, uowOf({ orders, wallets, refunds }));
    await useCase.execute({ userId: "user-1", orderId: "order-1" });

    expect(addFunds).toHaveBeenCalledWith("user-1", 105, { kind: "refundCancelledOrder" });
    expect(refunds.record).toHaveBeenCalledTimes(1);
    expect(refunds.record).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "user-1",
      kind: "cancellation",
      amount: 105,
      taxAmount: 10,
      lines: [],
    });
  });
});

describe("ResolveOrderReturn", () => {
  it("records a return refund attributed to the approving admin", async () => {
    const placed = order({
      status: "return_requested",
      items: [item({ id: "item-1", productId: "p1" })],
      taxAmount: 5,
      taxRate: 10,
    });
    const addFunds = vi.fn(async () => {});
    const refunds = fakeRefunds();
    const orders = stub<IOrderRepository>({
      getById: vi.fn(async () => placed),
      transitionStatus: vi.fn(async (_id: string, transition: OrderStatusTransition) => ({
        ...placed,
        status: transition.to.status,
        paymentStatus: transition.to.paymentStatus ?? placed.paymentStatus,
      })),
    });
    const wallets = stub<IWalletRepository>({ addFunds });

    const actor: ActivityActor = { id: "admin-1", name: "Admin" };
    const useCase = new ResolveOrderReturn(orders, uowOf({ orders, wallets, refunds }), notifier);
    await useCase.execute("order-1", "approve", actor);

    expect(refunds.record).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "user-1",
      kind: "return",
      amount: 105,
      taxAmount: 5,
      actorId: "admin-1",
      actorName: "Admin",
      lines: [],
    });
  });
});

describe("ResolveItemSubstitution", () => {
  const actor: ActivityActor = { id: "picker-1", name: "Picker" };

  it("records a substitution refund for a dropped out-of-stock line", async () => {
    const line = item({ id: "item-1", productId: "p1", quantity: 2, price: 20, taxExempt: false, taxAmount: 4 });
    const other = item({ id: "item-2", productId: "p2", quantity: 1, price: 60 });
    const placed = order({ items: [line, other], subtotal: 100, shipping: 5, total: 105 });

    const addFunds = vi.fn(async () => {});
    const refunds = fakeRefunds();
    const orders = stub<IOrderRepository>({
      getById: vi.fn(async () => placed),
      resolveItemSubstitution: vi.fn(async (_orderId, productId, resolution) => ({
        ...placed,
        items: placed.items.map((it) => (it.productId === productId ? { ...it, substitution: resolution } : it)),
      })),
    });
    const wallets = stub<IWalletRepository>({ addFunds });

    const useCase = new ResolveItemSubstitution(orders, stub<IProductRepository>({}), uowOf({ orders, wallets, refunds }), notifier);
    await useCase.execute({ orderId: "order-1", productId: "p1", resolution: { action: "refund" }, actor });

    // 40 gross, no discount to pro-rate, so the full line value is refunded.
    expect(addFunds).toHaveBeenCalledWith("user-1", 40, { kind: "refundOutOfStock", item: "Item" });
    expect(refunds.record).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "user-1",
      kind: "substitution",
      amount: 40,
      taxAmount: 4,
      actorId: "picker-1",
      actorName: "Picker",
      lines: [{ orderItemId: "item-1", productId: "p1", quantity: 2, amount: 40, taxAmount: 4 }],
    });
  });

  it("records a substitution refund for a cheaper replacement's saving", async () => {
    const line = item({
      id: "item-1",
      productId: "p1",
      quantity: 1,
      price: 20,
      substitutionPreference: "substitute",
      taxExempt: false,
    });
    const placed = order({ items: [line], subtotal: 20, shipping: 5, total: 25, taxRate: 10 });

    const addFunds = vi.fn(async () => {});
    const refunds = fakeRefunds();
    const orders = stub<IOrderRepository>({
      getById: vi.fn(async () => placed),
      resolveItemSubstitution: vi.fn(async (_orderId, productId, resolution) => ({
        ...placed,
        items: placed.items.map((it) => (it.productId === productId ? { ...it, substitution: resolution } : it)),
      })),
    });
    const wallets = stub<IWalletRepository>({ addFunds });
    const productRepo = stub<IProductRepository>({
      getById: vi.fn(async () => ({
        id: "p2",
        name: "Cheaper Replacement",
        price: 15,
        imageUrl: "",
        originalPrice: undefined,
        rating: 0,
        ratingCount: 0,
        stockQuantity: 10,
        categoryId: "cat-1",
        isFeatured: false,
        isPublished: true,
        taxExempt: false,
      })),
    });

    const useCase = new ResolveItemSubstitution(orders, productRepo, uowOf({ orders, wallets, refunds }), notifier);
    await useCase.execute({
      orderId: "order-1",
      productId: "p1",
      resolution: { action: "substitute", replacementProductId: "p2" },
      actor,
    });

    // Saving = 20 - 15 = 5, no discount to pro-rate.
    expect(addFunds).toHaveBeenCalledWith("user-1", 5, { kind: "substitutionSaving", item: "Item" });
    expect(refunds.record).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "user-1",
      kind: "substitution",
      amount: 5,
      taxAmount: expect.any(Number),
      actorId: "picker-1",
      actorName: "Picker",
      lines: [{ orderItemId: "item-1", productId: "p1", quantity: 1, amount: 5, taxAmount: expect.any(Number) }],
    });
  });
});
