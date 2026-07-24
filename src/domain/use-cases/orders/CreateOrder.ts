import type { Cart } from "../../entities/Cart";
import type { Order, SubstitutionPreference } from "../../entities/Order";
import type { GeoPoint } from "../../entities/Place";
import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";
import type { IAdminNotificationRepository } from "../../repositories/IAdminNotificationRepository";
import type { IEmailSender } from "../../repositories/IEmailSender";
import type { PromoCode } from "../../entities/PromoCode";
import { placeOrder } from "./placeOrder";
import { NotifyAdmins } from "../notifications/NotifyAdmins";

export type CreateOrderInput = {
  /** The user placing the order. */
  userId: string;
  /** Human-readable delivery address, resolved from the selected location. */
  location: string;
  /** Saved-address label of the selected location ("Home", "Gym"), snapshotted onto the order. */
  locationLabel?: string;
  /**
   * The selected location's coordinate, snapshotted so tracking maps the order to
   * where it's going. Omitted when the saved address carries none (older addresses
   * were saved without one) — tracking falls back to a default destination.
   */
  destination?: GeoPoint;
  /** The server-computed cart (items + authoritative totals) being checked out. */
  cart: Cart;
  /**
   * The promo code the cart's discount came from, when one was applied. Passed
   * alongside the cart rather than re-resolved here: the cart's totals were
   * computed from *this* code, and looking it up again could answer differently
   * (a campaign that expired in between) — the order would then be counted against
   * a promo it wasn't priced with, or not counted at all.
   */
  promo?: PromoCode;
  /** Delivery calendar date the shopper booked, `YYYY-MM-DD`. */
  deliveryDate: string;
  /** The delivery window the shopper booked (slug). */
  deliveryWindowId: string;
  /**
   * Per-line out-of-stock pre-approval, keyed by product id. A line absent from
   * the map (or the whole map omitted) defaults to `substitute` — the grocery
   * default of "replace it with something comparable".
   */
  substitutionPreferences?: Record<string, SubstitutionPreference>;
};

/**
 * Check out: snapshot the shopper's cart into an owned, trackable order, empty the
 * cart, and tell them it's confirmed. Totals and item prices come from the
 * server-computed cart — never the client — so the recorded amount can't be
 * tampered with.
 *
 * The order itself is written by {@link placeOrder}, which is shared with the
 * admin's phone-order path. What belongs *here* is everything checkout does that
 * placing an order in general does not: the cart it consumes, the promo redemption
 * it counts, and the confirmation the shopper is sent.
 *
 * Every order from this path is couriered and already paid — checkout books a
 * delivery window, and the order is only written once the charge went through.
 */
export class CreateOrder {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly cartRepo: ICartRepository,
    private readonly slotRepo: IDeliverySlotRepository,
    private readonly notifier: IOrderNotifier,
    private readonly promoRepo: IPromoCodeRepository,
    private readonly userRepo: IUserRepository,
    private readonly adminNotifications: IAdminNotificationRepository,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const { userId, promo, ...rest } = input;

    const order = await placeOrder(
      { uow: this.uow, slotRepo: this.slotRepo },
      { ...rest, userId, deliveryType: "delivery", paymentStatus: "paid" },
    );

    // The order now owns the snapshot, so the working cart is emptied.
    await this.cartRepo.clear(userId);

    // Count the redemption so the campaign's usage is visible in the dashboard.
    // Best-effort, like the notification below: the order is already recorded, and
    // an under-count on a reporting figure is never worth failing a placed order
    // for. Deliberately *not* a limit check — nothing here refuses the order.
    if (promo) {
      try {
        await this.promoRepo.recordUsage(promo.id);
      } catch (error) {
        console.error("Failed to record promo code usage:", error);
      }
    }

    // Tell the customer the order is confirmed. Best-effort side effect: the order
    // is already recorded, so the notifier swallows any delivery failure itself.
    await this.notifier.orderConfirmed(order);

    // Tell fulfilment the order exists — the bell's own best-effort side
    // effect, and the reason it needs a name for the customer at all.
    const customer = await this.userRepo.getById(userId);
    await new NotifyAdmins(this.userRepo, this.adminNotifications, this.emailSender).execute("orders.fulfill", {
      action: "order.placed",
      entityType: "order",
      entityId: order.id,
      entityLabel: order.id,
      actorId: userId,
      actorName: customer?.name,
    });

    return order;
  }
}
