import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "../../../errors/ValidationError";
import { RequestOrderReturn } from "../RequestOrderReturn";

import type { Order, OrderItem } from "../../../entities/Order";
import type { IAdminNotificationRepository } from "../../../repositories/IAdminNotificationRepository";
import type { IEmailSender } from "../../../repositories/IEmailSender";
import type { INotificationTemplateRepository } from "../../../repositories/INotificationTemplateRepository";
import type { IOrderRepository, OrderStatusTransition } from "../../../repositories/IOrderRepository";
import type { NewReturnRequest, IReturnRepository } from "../../../repositories/IReturnRepository";
import type { IUnitOfWork, TransactionalRepositories } from "../../../repositories/IUnitOfWork";
import type { IUserRepository } from "../../../repositories/IUserRepository";

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

const noop = stub<IUserRepository>({ getById: vi.fn(async () => null) });
const adminNotifications = stub<IAdminNotificationRepository>({});
const emailSender = stub<IEmailSender>({});
const templateRepo = stub<INotificationTemplateRepository>({});

describe("RequestOrderReturn", () => {
  it("values a partial-quantity line net of the order's discount share and scaled tax", async () => {
    // Ordered 4 units at 25 each (100 gross); a 20% order discount applies, and
    // the line carries 8 of tax across all 4 units (2/unit).
    const line = item({ id: "item-1", productId: "p1", quantity: 4, price: 25, taxAmount: 8 });
    const placed = order({
      items: [line],
      subtotal: 100,
      discount: 20,
      total: 85,
      taxAmount: 8,
      taxRate: 10,
    });

    const create = vi.fn(async (request: NewReturnRequest) => ({
      id: "return-1",
      rmaNumber: 1,
      orderId: request.orderId,
      userId: request.userId,
      status: "requested" as const,
      reason: request.reason,
      requestedAt: new Date().toISOString(),
      items: request.items.map((i, index) => ({ id: `return-item-${index}`, ...i })),
    }));
    const returns = stub<IReturnRepository>({ create });
    const orders = stub<IOrderRepository>({
      getById: vi.fn(async () => placed),
      transitionStatus: vi.fn(async (_id: string, transition: OrderStatusTransition) => ({
        ...placed,
        status: transition.to.status,
      })),
    });
    const uow: IUnitOfWork = {
      run: (work) => work({ orders, returns } as unknown as TransactionalRepositories),
    };

    const useCase = new RequestOrderReturn(orders, uow, noop, adminNotifications, emailSender, templateRepo);
    await useCase.execute({
      userId: "user-1",
      orderId: "order-1",
      reason: "Changed my mind",
      // Returning 2 of the 4 ordered units.
      items: [{ orderItemId: "item-1", quantity: 2 }],
    });

    expect(create).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "user-1",
      reason: "Changed my mind",
      items: [
        {
          orderItemId: "item-1",
          productId: "p1",
          quantity: 2,
          // Gross 2×25=50, net of the 20% discount share: 40.
          refundAmount: 40,
          // 8 tax / 4 units = 2/unit, × 2 units returned = 4.
          taxAmount: 4,
        },
      ],
    });
  });

  it("rejects a quantity greater than what was ordered", async () => {
    const line = item({ id: "item-1", productId: "p1", quantity: 2 });
    const placed = order({ items: [line] });
    const orders = stub<IOrderRepository>({ getById: vi.fn(async () => placed) });
    const uow: IUnitOfWork = { run: (work) => work({ orders } as unknown as TransactionalRepositories) };

    const useCase = new RequestOrderReturn(orders, uow, noop, adminNotifications, emailSender, templateRepo);
    await expect(
      useCase.execute({ userId: "user-1", orderId: "order-1", items: [{ orderItemId: "item-1", quantity: 3 }] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
