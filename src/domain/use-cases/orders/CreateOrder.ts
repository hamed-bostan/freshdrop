import type { Cart } from "../../entities/Cart";
import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import { formatWindowRange } from "../../entities/DeliveryWindow";
import type { Order, OrderItem, SubstitutionPreference } from "../../entities/Order";
import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import { SlotUnavailableError } from "../../errors/SlotUnavailableError";
import { ValidationError } from "../../errors/ValidationError";
import { SLOT_HORIZON_DAYS } from "../delivery-slots/GetDeliverySlots";

export type CreateOrderInput = {
  /** The user placing the order. */
  userId: string;
  /** Human-readable delivery address, resolved from the selected location. */
  location: string;
  /** Saved-address label of the selected location ("Home", "Gym"), snapshotted onto the order. */
  locationLabel?: string;
  /** The server-computed cart (items + authoritative totals) being checked out. */
  cart: Cart;
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

/** The out-of-stock pre-approval used when the customer didn't set one for a line. */
const DEFAULT_SUBSTITUTION_PREFERENCE: SubstitutionPreference = "substitute";

const DAY_MS = 24 * 60 * 60 * 1000;

const slotDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Place an order: snapshot the cart into an owned, trackable order and empty the
 * cart. A freshly placed order is live (`current`), in progress (`processing`)
 * and at the first delivery milestone (`confirmed`). Totals and item prices come
 * from the server-computed cart — never the client — so the recorded amount can't
 * be tampered with.
 *
 * Two scarce resources are claimed before the order is recorded, each with an
 * atomic guard so the order is refused rather than oversold: product stock, and
 * the booked delivery slot's capacity. As with stock, the slot claim isn't rolled
 * back if a later step fails — the same non-atomic seam the stock decrement already
 * accepts (a rare, self-healing under-count, never an oversell).
 */
export class CreateOrder {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
    private readonly slotRepo: IDeliverySlotRepository,
    private readonly notifier: IOrderNotifier,
  ) {}

  async execute({
    userId,
    location,
    locationLabel,
    cart,
    deliveryDate,
    deliveryWindowId,
    substitutionPreferences,
  }: CreateOrderInput): Promise<Order> {
    if (cart.items.length === 0) {
      throw new ValidationError("cart", "Your cart is empty.");
    }

    // Resolve the booked window (for its capacity + display snapshot) and confirm
    // the date is still inside the offered horizon — the server never trusts the
    // client's view of what's bookable.
    const windows = await this.slotRepo.listWindows();
    const window = windows.find((w) => w.id === deliveryWindowId);
    if (!window || !isWithinHorizon(deliveryDate)) {
      throw new SlotUnavailableError("That delivery time is no longer available.");
    }

    const items: OrderItem[] = cart.items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      quantity,
      // Snapshot the unit price so a later substitution refund uses the amount
      // actually charged, not today's catalog price.
      price: product.price,
      substitutionPreference:
        substitutionPreferences?.[product.id] ?? DEFAULT_SUBSTITUTION_PREFERENCE,
    }));

    // Claim the stock first (all-or-nothing). If anything is short this throws
    // before the order is created, so we never record an oversold order.
    await this.productRepo.decrementStock(
      cart.items.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        quantity,
      })),
    );

    // Then claim one unit of the slot's capacity (atomic guard). A full window is
    // refused here, so the slot is never overbooked.
    const claimed = await this.slotRepo.claim(deliveryDate, window.id, window.capacity);
    if (!claimed) {
      throw new SlotUnavailableError(`${slotLabel(deliveryDate, window)} is fully booked.`);
    }

    const order = await this.orderRepo.createOrder({
      userId,
      status: "processing",
      phase: "current",
      stage: "confirmed",
      placedAt: new Date().toISOString(),
      location,
      locationLabel,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total,
      deliveryDate,
      deliveryWindowId: window.id,
      deliveryWindow: slotLabel(deliveryDate, window),
      items,
    });

    // The order now owns the snapshot, so the working cart is emptied.
    await this.cartRepo.clear(userId);

    // Tell the customer the order is confirmed. Best-effort side effect: the order
    // is already recorded, so the notifier swallows any delivery failure itself.
    await this.notifier.orderConfirmed(order);

    return order;
  }
}

/** Whether `date` (YYYY-MM-DD) falls within [today, today + horizon) in UTC. */
function isWithinHorizon(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const now = new Date();
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const dayOffset = Math.round((target - startOfToday) / DAY_MS);
  return dayOffset >= 0 && dayOffset < SLOT_HORIZON_DAYS;
}

/** Absolute display snapshot, e.g. "Thu, Jul 3 · 6:00 – 8:00 PM" — stable over time. */
function slotLabel(date: string, window: DeliveryWindow): string {
  const day = slotDateFormatter.format(new Date(`${date}T00:00:00Z`));
  return `${day} · ${formatWindowRange(window.startMinutes, window.endMinutes)}`;
}
