import type { Cart } from "../../entities/Cart";
import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import { formatWindowRange } from "../../entities/DeliveryWindow";
import type { Order, OrderItem, SubstitutionPreference } from "../../entities/Order";
import type { GeoPoint } from "../../entities/Place";
import type { ICartRepository } from "../../repositories/ICartRepository";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import type { IOrderRepository } from "../../repositories/IOrderRepository";
import type { IProductRepository, StockAdjustment } from "../../repositories/IProductRepository";
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
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly productRepo: IProductRepository,
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
    // The three live in separate aggregates behind separate ports, so they can't
    // be written in one database transaction.
    //
    // What makes that safe is that every claim is undoable and every failure
    // undoes the claims already made (below). The alternative — leaving them
    // held — means a checkout that fails halfway silently removes stock from the
    // catalog and capacity from the day, with no order anywhere to explain
    // either, and no way back except a database console.
    await this.productRepo.decrementStock(stockLines, { reason: "sale", orderId });

    // One unit of the slot's capacity (atomic guard). A full window is refused
    // here, so the slot is never overbooked.
    const claimed = await this.slotRepo.claim(deliveryDate, window.id, window.capacity);
    if (!claimed) {
      // The window filled up while we were claiming stock. Put the units back
      // before reporting it, or the shopper's retry — and everyone else's cart —
      // is short by an order that was never placed.
      await this.releaseStock(stockLines, orderId);
      throw new SlotUnavailableError(`${slotLabel(deliveryDate, window)} is fully booked.`);
    }

    let order: Order;
    try {
      order = await this.orderRepo.createOrder({
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
    } catch (error) {
      // The order didn't land, so nothing justifies either claim. Give both back
      // and let the original failure surface — the shopper sees why checkout
      // failed, not a compensation detail.
      await this.slotRepo.release(deliveryDate, window.id).catch((releaseError) => {
        console.error(`Failed to release slot ${deliveryDate}#${window.id} for order ${orderId}:`, releaseError);
      });
      await this.releaseStock(stockLines, orderId);
      throw error;
    }

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

  /**
   * Put back stock claimed for an order that never landed.
   *
   * Recorded as a `restock` against the same order id, so the ledger carries both
   * halves: the sale that took the units and the release that returned them. A
   * silent reversal would leave a history showing units leaving for an order
   * nobody can find — the exact question the ledger exists to answer.
   *
   * Never rethrows. It runs on a path that is already failing, and the shopper
   * needs to hear why checkout failed, not that the cleanup afterwards also did.
   * A failure here is logged with the order id: the units stay claimed, and the
   * ledger's unbalanced pair is what makes that findable rather than invisible.
   */
  private async releaseStock(lines: readonly StockAdjustment[], orderId: string): Promise<void> {
    try {
      await this.productRepo.incrementStock(lines, { reason: "restock", orderId });
    } catch (error) {
      console.error(`Failed to release stock claimed for abandoned order ${orderId}:`, error);
    }
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
