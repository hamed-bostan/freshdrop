import { round2 } from "@/src/lib/money";

import { isReturnable, refundForLineValue, RETURN_WINDOW_DAYS } from "../../entities/Order";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { NotifyAdmins } from "../notifications/NotifyAdmins";

import type { Order } from "../../entities/Order";
import type { IAdminNotificationRepository } from "../../repositories/IAdminNotificationRepository";
import type { IEmailSender } from "../../repositories/IEmailSender";
import type { INotificationTemplateRepository } from "../../repositories/INotificationTemplateRepository";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { NewReturnItem } from "../../repositories/IReturnRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import type { IUserRepository } from "../../repositories/IUserRepository";


/** One line the customer is asking to return, by the order item it's on. */
export type RequestOrderReturnItemInput = {
  orderItemId: string;
  /** Must be between 1 and that line's ordered quantity. */
  quantity: number;
};

export type RequestOrderReturnInput = {
  /** The user requesting the return — the order must belong to them. */
  userId: string;
  /** The delivered order being returned. */
  orderId: string;
  /** Why, in the customer's own words. Optional — the field is free text. */
  reason?: string;
  /** Which lines, and how many units of each. At least one is required. */
  items: RequestOrderReturnItemInput[];
};

/**
 * Open a return request on a delivered order — the customer "Return" action.
 * Allowed only on a delivered (`completed`) order still inside the return window
 * (see `isReturnable`). This is a *request*: it moves the order to
 * `return_requested` and records a `ReturnRequest` (with a line per selected
 * item, valued at what refunding it would credit — see `refundForLineValue`) but
 * moves no money or stock yet — an admin decides from the dashboard (see
 * `ResolveOrderReturn`), the same request-then-moderate shape the app uses for
 * reviews.
 *
 * The order transition and the `ReturnRequest` insert are one transaction: a
 * request that flipped the order's status but recorded nothing about what's
 * being returned would leave `ResolveOrderReturn` with no record to act on.
 */
export class RequestOrderReturn {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly uow: IUnitOfWork,
    private readonly userRepo: IUserRepository,
    private readonly adminNotifications: IAdminNotificationRepository,
    private readonly emailSender: IEmailSender,
    private readonly templateRepo: INotificationTemplateRepository,
  ) {}

  async execute({ userId, orderId, reason, items }: RequestOrderReturnInput): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    // Owner mismatch is reported as "not found" so we don't leak the order's existence.
    if (order?.userId !== userId) throw new NotFoundError("order", orderId);

    if (!isReturnable(order)) {
      throw new ValidationError(
        "order",
        `This order can't be returned. Returns are open for ${RETURN_WINDOW_DAYS} days after a delivered order.`,
      );
    }

    if (items.length === 0) {
      throw new ValidationError("items", "Select at least one item to return.");
    }

    const returnItems: NewReturnItem[] = items.map((selected) => {
      const line = order.items.find((item) => item.id === selected.orderItemId);
      if (!line) throw new ValidationError("items", "One of the selected items isn't on this order.");
      if (!Number.isInteger(selected.quantity) || selected.quantity < 1 || selected.quantity > line.quantity) {
        throw new ValidationError("items", `Quantity for "${line.name}" must be between 1 and ${line.quantity}.`);
      }
      const refundAmount = refundForLineValue(order, line.price * selected.quantity);
      // The line's snapshotted tax share is for its full ordered quantity; scale
      // it down to the units actually being returned.
      const unitTax = line.taxAmount != null ? line.taxAmount / line.quantity : 0;
      const taxAmount = round2(unitTax * selected.quantity);
      return { orderItemId: line.id, productId: line.productId, quantity: selected.quantity, refundAmount, taxAmount };
    });

    const requested = await this.uow.run(async ({ orders, returns }) => {
      const requested = await orders.transitionStatus(orderId, {
        from: { status: "completed" },
        to: { status: "return_requested" },
      });
      // Already moved on (e.g. a return was requested on another tab).
      if (!requested) throw new ValidationError("order", "This order can't be returned.");

      await returns.create({ orderId, userId, reason, items: returnItems });
      return requested;
    });

    // Someone has to approve or reject this — tell whoever resolves returns.
    // Best-effort, like every other admin notification: the request already
    // stands regardless of whether the fan-out succeeds.
    const customer = await this.userRepo.getById(userId);
    await new NotifyAdmins(this.userRepo, this.adminNotifications, this.emailSender, this.templateRepo).execute(
      "orders.fulfill",
      {
        action: "order.returnRequested",
        entityType: "order",
        entityId: requested.id,
        entityLabel: requested.id,
        actorId: userId,
        actorName: customer?.name,
      },
    );

    return requested;
  }
}
