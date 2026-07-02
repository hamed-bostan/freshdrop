import type { Order } from "@/src/domain/entities/Order";
import type { NotificationKind, NotificationRecipient } from "@/src/domain/entities/Notification";
import type { INotificationChannel } from "@/src/domain/repositories/INotificationChannel";
import type { IOrderNotifier } from "@/src/domain/repositories/IOrderNotifier";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import { buildOrderMessage, type SubstitutionContext } from "./messages";

/**
 * The concrete order notifier: resolves the order's owner, renders the event to a
 * channel-agnostic message, and fans it out to every configured channel (SMS,
 * push, …). The one place that knows the channels — use-cases depend only on
 * {@link IOrderNotifier}.
 *
 * Best-effort by contract: the triggering state change has already committed, so
 * every path here is wrapped — a failed recipient lookup or a throwing channel is
 * logged and swallowed, never rethrown. `Promise.allSettled` isolates channels
 * from one another so a dead SMS gateway can't suppress the push.
 */
export class OrderNotifier implements IOrderNotifier {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly channels: readonly INotificationChannel[],
  ) {}

  orderConfirmed(order: Order): Promise<void> {
    return this.dispatch("order_confirmed", order);
  }

  orderOutForDelivery(order: Order): Promise<void> {
    return this.dispatch("order_out_for_delivery", order);
  }

  orderDelivered(order: Order): Promise<void> {
    return this.dispatch("order_delivered", order);
  }

  returnApproved(order: Order): Promise<void> {
    return this.dispatch("return_approved", order);
  }

  itemSubstituted(order: Order, itemName: string, replacementName: string): Promise<void> {
    return this.dispatch("item_substituted", order, { itemName, replacementName });
  }

  itemRefunded(order: Order, itemName: string): Promise<void> {
    return this.dispatch("item_refunded", order, { itemName });
  }

  orderCancelledOutOfStock(order: Order): Promise<void> {
    return this.dispatch("order_cancelled_out_of_stock", order);
  }

  private async dispatch(
    kind: NotificationKind,
    order: Order,
    context?: SubstitutionContext,
  ): Promise<void> {
    if (this.channels.length === 0) return;

    try {
      const user = await this.userRepo.getById(order.userId);
      const recipient: NotificationRecipient = {
        userId: order.userId,
        phone: user?.phone ?? null,
        name: user?.name ?? "",
      };
      const message = buildOrderMessage(kind, order, context);

      const results = await Promise.allSettled(
        this.channels.map((channel) => channel.send(recipient, message)),
      );
      for (const result of results) {
        if (result.status === "rejected") {
          console.error(`[notification] channel failed for ${kind} on order ${order.id}:`, result.reason);
        }
      }
    } catch (error) {
      console.error(`[notification] failed to dispatch ${kind} for order ${order.id}:`, error);
    }
  }
}
