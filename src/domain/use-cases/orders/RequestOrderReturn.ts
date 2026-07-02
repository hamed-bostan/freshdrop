import type { Order } from "../../entities/Order";
import { isReturnable, RETURN_WINDOW_DAYS } from "../../entities/Order";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

export type RequestOrderReturnInput = {
  /** The user requesting the return — the order must belong to them. */
  userId: string;
  /** The delivered order being returned. */
  orderId: string;
};

/**
 * Open a return request on a delivered order — the customer "Return" action.
 * Allowed only on a delivered (`completed`) order still inside the return window
 * (see `isReturnable`). This is a *request*: it moves the order to
 * `return_requested` and no money or stock moves yet — an admin decides from the
 * dashboard (see `ResolveOrderReturn`), the same request-then-moderate shape the
 * app uses for reviews. The guarded transition makes a double-submit a no-op.
 */
export class RequestOrderReturn {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute({ userId, orderId }: RequestOrderReturnInput): Promise<Order> {
    const order = await this.orderRepo.getById(orderId);
    // Owner mismatch is reported as "not found" so we don't leak the order's existence.
    if (!order || order.userId !== userId) throw new NotFoundError("order", orderId);

    if (!isReturnable(order)) {
      throw new ValidationError(
        "order",
        `This order can't be returned. Returns are open for ${RETURN_WINDOW_DAYS} days after a delivered order.`,
      );
    }

    const requested = await this.orderRepo.transitionStatus(orderId, {
      from: { status: "completed" },
      to: { status: "return_requested" },
    });
    // Already moved on (e.g. a return was requested on another tab).
    if (!requested) {
      throw new ValidationError("order", "This order can't be returned.");
    }

    return requested;
  }
}
