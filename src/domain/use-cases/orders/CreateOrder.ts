import type { Cart } from "../../entities/Cart";
import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import { formatWindowRange } from "../../entities/DeliveryWindow";
import type { Order, OrderItem, SubstitutionPreference } from "../../entities/Order";
import type { GeoPoint } from "../../entities/Place";
import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import type { IPromoCodeRepository } from "../../repositories/IPromoCodeRepository";
import type { PromoCode } from "../../entities/PromoCode";
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
    private readonly uow: IUnitOfWork,
    private readonly cartRepo: ICartRepository,
    private readonly slotRepo: IDeliverySlotRepository,
    private readonly notifier: IOrderNotifier,
    private readonly promoRepo: IPromoCodeRepository,
  ) {}

  async execute({
    userId,
    location,
    locationLabel,
    destination,
    cart,
    promo,
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

    // The order's id, minted here rather than by the repository, because the
    // stock claimed below is attributed to this order and the claim has to happen
    // before the order exists (see below). `crypto` is the platform global, not a
    // Node import — the domain stays framework-free.
    const orderId = crypto.randomUUID();

    const stockLines = cart.items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      quantity,
    }));

    // Checkout claims two scarce resources — units of stock and a seat in a
    // delivery window — and then records the order that justifies holding them.
    // All three commit together or none of them do.
    //
    // This used to be a compensating sequence: claim, claim, write, and undo the
    // earlier claims by hand if a later step failed. That is the right shape when
    // the three live in different *services*; here they are three tables in one
    // Postgres, so the database can do it properly. The compensations it replaces
    // had the flaw every hand-rolled rollback has — they can themselves fail, and
    // when they did the units stayed claimed with no order to explain them.
    //
    // Both guards keep working inside the transaction, and still refuse rather
    // than oversell: a short line throws `InsufficientStockError`, a full window
    // resolves `false`. Either way nothing is left held.
    const order = await this.uow.run(async ({ products, slots, orders }) => {
      await products.decrementStock(stockLines, { reason: "sale", orderId });

      // One unit of the slot's capacity (atomic guard). A full window is refused
      // here, so the slot is never overbooked.
      const claimed = await slots.claim(deliveryDate, window.id, window.capacity);
      if (!claimed) {
        // The window filled up while we were claiming stock. Throwing rolls the
        // stock decrement back with it — no release to write, and none to fail.
        throw new SlotUnavailableError(`${slotLabel(deliveryDate, window)} is fully booked.`);
      }

      return orders.createOrder({
        id: orderId,
        userId,
        status: "processing",
        phase: "current",
        stage: "confirmed",
        placedAt: new Date().toISOString(),
        location,
        locationLabel,
        destination,
        subtotal: cart.subtotal,
        shipping: cart.shipping,
        discount: cart.discount,
        total: cart.total,
        deliveryDate,
        deliveryWindowId: window.id,
        deliveryWindow: slotLabel(deliveryDate, window),
        items,
      });
    });

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
