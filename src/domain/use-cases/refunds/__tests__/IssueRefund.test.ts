import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../../errors/NotFoundError";
import { ValidationError } from "../../../errors/ValidationError";
import { IssueRefund } from "../IssueRefund";

import type { ActivityActor } from "../../../entities/ActivityEntry";
import type { Order, OrderItem } from "../../../entities/Order";
import type { IDeliverySlotRepository } from "../../../repositories/IDeliverySlotRepository";
import type { IOrderRepository } from "../../../repositories/IOrderRepository";
import type { IProductRepository } from "../../../repositories/IProductRepository";
import type { NewRefund, IRefundRepository } from "../../../repositories/IRefundRepository";
import type { IReturnRepository } from "../../../repositories/IReturnRepository";
import type { IUnitOfWork, TransactionalRepositories } from "../../../repositories/IUnitOfWork";
import type { IWalletRepository } from "../../../repositories/IWalletRepository";

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
    status: "completed",
    phase: "previous",
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
    walletApplied: 0,
    refunds: [],
    ...overrides,
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

function fakeReturns() {
  return stub<IReturnRepository>({ getForOrder: vi.fn(async () => null) });
}

const actor: ActivityActor = { id: "admin-1", name: "Admin" };

function setup(placed: Order, addFunds = vi.fn(async () => {})) {
  const refunds = fakeRefunds();
  const wallets = stub<IWalletRepository>({ addFunds });
  const orders = stub<IOrderRepository>({
    getById: vi.fn(async () => placed),
    lockById: vi.fn(async () => placed),
  });
  const uow: IUnitOfWork = {
    run: (work) =>
      work({
        orders,
        products: stub<IProductRepository>({}),
        wallets,
        slots: stub<IDeliverySlotRepository>({}),
        refunds,
        returns: fakeReturns(),
      } satisfies TransactionalRepositories),
  };
  return { orders, wallets, refunds, uow, addFunds };
}

describe("IssueRefund", () => {
  it("refunds a bare amount and derives its VAT share from the order's rate", async () => {
    const placed = order({ items: [item({ id: "item-1", productId: "p1" })], taxRate: 10 });
    const { uow, addFunds, refunds } = setup(placed);

    const useCase = new IssueRefund(
      stub<IOrderRepository>({ getById: vi.fn(async () => placed) }),
      uow,
    );
    const updated = await useCase.execute({
      orderId: "order-1",
      reason: "Customer complaint",
      actor,
      target: { kind: "amount", amount: 20 },
    });

    expect(addFunds).toHaveBeenCalledWith("user-1", 20, { kind: "manualRefund" });
    expect(refunds.record).toHaveBeenCalledWith(
      {
        orderId: "order-1",
        userId: "user-1",
        kind: "manual",
        amount: 20,
        taxAmount: expect.closeTo(1.82, 2),
        reason: "Customer complaint",
        actorId: "admin-1",
        actorName: "Admin",
        lines: [],
      },
      expect.any(Function),
    );
    expect(updated.refunds).toHaveLength(1);
  });

  it("refunds specific lines net of their pro-rata discount share", async () => {
    const line = item({ id: "item-1", productId: "p1", quantity: 2, price: 20, taxExempt: false });
    const other = item({ id: "item-2", productId: "p2", quantity: 1, price: 60 });
    // 10% discount on a 100 subtotal.
    const placed = order({ items: [line, other], subtotal: 100, discount: 10, total: 95, taxRate: 10 });
    const { uow, addFunds, refunds } = setup(placed);

    const useCase = new IssueRefund(stub<IOrderRepository>({ getById: vi.fn(async () => placed) }), uow);
    await useCase.execute({
      orderId: "order-1",
      reason: "One item arrived damaged",
      actor,
      target: { kind: "lines", lines: [{ orderItemId: "item-1", quantity: 1 }] },
    });

    // Gross 20 (1 unit), net of 10% discount = 18.
    expect(addFunds).toHaveBeenCalledWith("user-1", 18, { kind: "manualRefund" });
    expect(refunds.record).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 18,
        lines: [{ orderItemId: "item-1", productId: "p1", quantity: 1, amount: 18, taxAmount: expect.any(Number) }],
      }),
      expect.any(Function),
    );
  });

  it("rejects an amount over what's left to refund, checked against the locked order", async () => {
    const placed = order({
      items: [item({ id: "item-1", productId: "p1" })],
      total: 105,
      refunds: [
        {
          id: "refund-existing",
          orderId: "order-1",
          userId: "user-1",
          kind: "manual",
          amount: 100,
          taxAmount: 0,
          createdAt: new Date().toISOString(),
          lines: [],
        },
      ],
    });
    const { uow, addFunds } = setup(placed);

    const useCase = new IssueRefund(stub<IOrderRepository>({ getById: vi.fn(async () => placed) }), uow);

    // Only 5 is left to refund; 10 must be rejected.
    await expect(
      useCase.execute({
        orderId: "order-1",
        reason: "Too much",
        actor,
        target: { kind: "amount", amount: 10 },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(addFunds).not.toHaveBeenCalled();
  });

  it("re-checks the cap against the row locked inside the transaction, not the caller's stale read", async () => {
    // The caller's initial read sees the order as unrefunded...
    const staleRead = order({ items: [item({ id: "item-1", productId: "p1" })], total: 105 });
    // ...but by the time the lock is acquired, a concurrent refund has already
    // taken all but 5.
    const lockedRead = order({
      ...staleRead,
      refunds: [
        {
          id: "refund-concurrent",
          orderId: "order-1",
          userId: "user-1",
          kind: "manual",
          amount: 100,
          taxAmount: 0,
          createdAt: new Date().toISOString(),
          lines: [],
        },
      ],
    });
    const refunds = fakeRefunds();
    const wallets = stub<IWalletRepository>({ addFunds: vi.fn(async () => {}) });
    const lockById = vi.fn(async () => lockedRead);
    const orders = stub<IOrderRepository>({ getById: vi.fn(async () => staleRead), lockById });
    const uow: IUnitOfWork = {
      run: (work) =>
        work({
          orders,
          products: stub<IProductRepository>({}),
          wallets,
          slots: stub<IDeliverySlotRepository>({}),
          refunds,
          returns: fakeReturns(),
        } satisfies TransactionalRepositories),
    };

    const useCase = new IssueRefund(orders, uow);
    await expect(
      useCase.execute({ orderId: "order-1", reason: "Race", actor, target: { kind: "amount", amount: 10 } }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(lockById).toHaveBeenCalledWith("order-1");
    expect(refunds.record).not.toHaveBeenCalled();
  });

  it("rejects a reasonless request before touching the transaction", async () => {
    const placed = order({ items: [item({ id: "item-1", productId: "p1" })] });
    const { uow } = setup(placed);
    const useCase = new IssueRefund(stub<IOrderRepository>({ getById: vi.fn(async () => placed) }), uow);

    await expect(
      useCase.execute({ orderId: "order-1", reason: "   ", actor, target: { kind: "amount", amount: 10 } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a line quantity beyond what was ordered", async () => {
    const placed = order({ items: [item({ id: "item-1", productId: "p1", quantity: 2 })] });
    const { uow } = setup(placed);
    const useCase = new IssueRefund(stub<IOrderRepository>({ getById: vi.fn(async () => placed) }), uow);

    await expect(
      useCase.execute({
        orderId: "order-1",
        reason: "Too many",
        actor,
        target: { kind: "lines", lines: [{ orderItemId: "item-1", quantity: 3 }] },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("404s on an order that no longer exists", async () => {
    const orders = stub<IOrderRepository>({ getById: vi.fn(async () => null) });
    const useCase = new IssueRefund(orders, stub<IUnitOfWork>({}));

    await expect(
      useCase.execute({ orderId: "missing", reason: "x", actor, target: { kind: "amount", amount: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
