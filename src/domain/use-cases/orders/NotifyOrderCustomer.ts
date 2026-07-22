import type { ActivityActor } from "../../entities/ActivityEntry";
import { singleChange } from "../../entities/ActivityEntry";
import type { Order, OrderItem } from "../../entities/Order";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IEmailSender } from "../../repositories/IEmailSender";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";

/**
 * What an admin asked to send.
 *
 * The lifecycle kinds name {@link IOrderNotifier} methods, so a resend is the exact
 * message the automatic send would have produced — the point of this feature is
 * that a customer who missed one gets *that* notification again, not an admin's
 * approximation of it. `message` is the escape hatch for everything a template
 * can't say ("your driver is running late"), and it's the only kind that composes
 * text, which is why it's the only one that goes by email.
 */
export type OrderNotificationRequest =
  | { kind: "orderConfirmed" }
  | { kind: "orderOutForDelivery" }
  | { kind: "orderDelivered" }
  | { kind: "returnApproved" }
  | { kind: "itemSubstituted"; productId: string }
  | { kind: "itemRefunded"; productId: string }
  | { kind: "message"; subject: string; body: string };

/** What was sent, for the caller to report back. */
export type OrderNotificationResult = {
  kind: OrderNotificationRequest["kind"];
  /** How the customer was reached — the notifier's channels, or email. */
  via: "notification" | "email";
};

/**
 * Send a customer a message about their order, on purpose rather than as a side
 * effect of a state change. Admin only.
 *
 * Every automatic notification in this app fires from the transition that caused it
 * and is best-effort — an SMS gateway that was down when an order shipped simply
 * means the customer never heard. Until now there was no way to fix that from the
 * dashboard: the notifier existed, and nothing but a state change could reach it.
 * This is that missing door, and it deliberately reuses the same notifier and the
 * same templates rather than introducing a second way to word "your order is on the
 * way".
 *
 * Two rules keep it from being a broadcast tool. First, a lifecycle notification is
 * refused unless the order is actually in that state — you cannot tell someone their
 * order was delivered before it was, because the message would be a lie the system
 * helped write. Second, every send is logged with who sent it: a message to a
 * customer is an admin action, and the order's own activity panel is where anyone
 * looking into a complaint will go.
 *
 * The send itself stays best-effort, because {@link IOrderNotifier} is — so the log
 * records that an admin *sent* it, which is the honest claim. Whether the SMS
 * arrived is not something this or any caller can know.
 */
export class NotifyOrderCustomer {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly userRepo: IUserRepository,
    private readonly notifier: IOrderNotifier,
    private readonly emailSender: IEmailSender,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(
    orderId: string,
    request: OrderNotificationRequest,
    actor: ActivityActor,
  ): Promise<OrderNotificationResult> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) throw new NotFoundError("order", orderId);

    const result =
      request.kind === "message"
        ? await this.sendMessage(order, request.subject, request.body)
        : await this.sendLifecycle(order, request);

    // After the send, and best-effort like the rest of the activity log: the
    // message has already gone, and failing the request now would invite an admin
    // to send it a second time.
    await this.activityLog.recordEvent({
      actorId: actor.id,
      actorName: actor.name,
      action: "order.customerNotified",
      entityType: "order",
      entityId: order.id,
      entityLabel: order.id,
      // Not a field that moved — nothing about the order changed — so the "before"
      // is empty and the "after" names what was sent. The log's shape is a diff;
      // this is the honest way to say "an event, not an edit" in it.
      changes: singleChange("notification", null, request.kind),
    });

    return result;
  }

  /** Re-fire one of the automatic lifecycle notifications, if the order is in that state. */
  private async sendLifecycle(
    order: Order,
    request: Exclude<OrderNotificationRequest, { kind: "message" }>,
  ): Promise<OrderNotificationResult> {
    switch (request.kind) {
      case "orderConfirmed":
        // Always available: every order was confirmed at some point, and this is
        // the one customers most often ask to be sent again.
        await this.notifier.orderConfirmed(order);
        break;

      case "orderOutForDelivery":
        if (order.stage !== "shipped" && order.stage !== "arrived") {
          throw new ValidationError("kind", "That order hasn't gone out for delivery yet.");
        }
        await this.notifier.orderOutForDelivery(order);
        break;

      case "orderDelivered":
        if (order.stage !== "arrived") {
          throw new ValidationError("kind", "That order hasn't been delivered yet.");
        }
        await this.notifier.orderDelivered(order);
        break;

      case "returnApproved":
        if (order.status !== "refunded") {
          throw new ValidationError("kind", "That order's return hasn't been approved.");
        }
        await this.notifier.returnApproved(order);
        break;

      case "itemSubstituted": {
        const item = this.resolveLine(order, request.productId);
        const replacement = item.substitution?.replacement;
        if (item.substitution?.status !== "substituted" || !replacement) {
          throw new ValidationError("productId", "That line wasn't substituted.");
        }
        await this.notifier.itemSubstituted(order, item.name, replacement.name);
        break;
      }

      case "itemRefunded": {
        const item = this.resolveLine(order, request.productId);
        if (item.substitution?.status !== "refunded") {
          throw new ValidationError("productId", "That line wasn't refunded.");
        }
        await this.notifier.itemRefunded(order, item.name);
        break;
      }
    }

    return { kind: request.kind, via: "notification" };
  }

  /**
   * Send a one-off message about the order by email.
   *
   * Email rather than the notifier's channels because this is free text: the SMS
   * channel sends approved pattern templates with filled-in variables (a
   * regulatory constraint of the market, not a design choice), so arbitrary prose
   * has nowhere to go in it. The order id is appended to the subject so the reply
   * lands somewhere identifiable.
   */
  private async sendMessage(
    order: Order,
    subject: string,
    body: string,
  ): Promise<OrderNotificationResult> {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject) throw new ValidationError("subject", "A subject is required.");
    if (!trimmedBody) throw new ValidationError("body", "A message is required.");

    const user = await this.userRepo.getById(order.userId);
    // Refused rather than silently dropped: `IEmailSender.send` swallows its own
    // failures, so without this check an admin would be told their message went to
    // a customer who has no address on file.
    if (!user?.email) {
      throw new ValidationError("body", "That customer has no email address on file.");
    }

    await this.emailSender.send({
      to: user.email,
      subject: `${trimmedSubject} (order #${order.id})`,
      text: trimmedBody,
    });

    return { kind: "message", via: "email" };
  }

  /** The order line for a product id, or a 404 — the id comes from the client. */
  private resolveLine(order: Order, productId: string): OrderItem {
    const item = order.items.find((line) => line.productId === productId);
    if (!item) throw new NotFoundError("order item", productId);
    return item;
  }
}
