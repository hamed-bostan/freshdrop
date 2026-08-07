import { lineTaxAmount } from "../../entities/Cart";
import { formatWindowRange } from "../../entities/DeliveryWindow";
import { InsufficientWalletBalanceError } from "../../errors/InsufficientWalletBalanceError";
import { SlotUnavailableError } from "../../errors/SlotUnavailableError";
import { ValidationError } from "../../errors/ValidationError";
import { SLOT_HORIZON_DAYS } from "../delivery-slots/GetDeliverySlots";

import type { Cart } from "../../entities/Cart";
import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import type {
  DeliveryType,
  Order,
  OrderItem,
  PaymentStatus,
  SubstitutionPreference,
} from "../../entities/Order";
import type { GeoPoint } from "../../entities/Place";
import type { AuditHook } from "../../repositories/AuditHook";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";


/** The out-of-stock pre-approval used when no preference was set for a line. */
const DEFAULT_SUBSTITUTION_PREFERENCE: SubstitutionPreference = "substitute";

const DAY_MS = 24 * 60 * 60 * 1000;

const slotDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export type PlaceOrderInput = {
  /** The customer the order belongs to — whoever is *entering* it is not recorded here. */
  userId: string;
  location: string;
  locationLabel?: string;
  destination?: GeoPoint;
  city?: string;
  /** Server-computed lines and totals (see `priceCart`) — never client-supplied amounts. */
  cart: Cart;
  deliveryDate: string;
  deliveryWindowId: string;
  substitutionPreferences?: Record<string, SubstitutionPreference>;
  /** Free-text note for the courier, captured at checkout. Capped by the contract schema. */
  deliveryInstructions?: string;
  /**
   * How much of the cart's total to pay from the customer's wallet balance,
   * `0`/omitted when none is applied. Debited atomically alongside the order
   * write; refused with {@link InsufficientWalletBalanceError} if the wallet
   * can't cover it.
   */
  walletApplied?: number;
  deliveryType: DeliveryType;
  paymentStatus: PaymentStatus;
  /**
   * Audit entry for the order row, written in the same transaction. Supplied only
   * when someone other than the customer placed it — see `IOrderRepository.createOrder`.
   */
  audit?: AuditHook<Order>;
};

/**
 * Record an order and claim what it consumes — the shared heart of every way an
 * order comes into existence.
 *
 * Extracted from `CreateOrder` when a second caller appeared: an admin placing an
 * order for a customer over the phone. The two differ in everything *around* the
 * write — where the lines come from, whether a cart gets emptied, whether a promo
 * redemption is counted, who is told — and in nothing about the write itself. A
 * second copy of this would be a second answer to "what does it mean to place an
 * order", and the copy is always the one that forgets to claim the stock.
 *
 * Two scarce resources are claimed before the order is recorded, each with an
 * atomic guard so the order is refused rather than oversold: product stock, and
 * the booked delivery slot's capacity. All three writes commit together or none
 * of them do — a compensating sequence was the old shape here, and hand-rolled
 * rollbacks have the flaw that they can themselves fail, leaving units claimed
 * with no order to explain them.
 */
export async function placeOrder(
  deps: { uow: IUnitOfWork; slotRepo: IDeliverySlotRepository },
  input: PlaceOrderInput,
): Promise<Order> {
  const {
    userId,
    location,
    locationLabel,
    destination,
    city,
    cart,
    deliveryDate,
    deliveryWindowId,
    substitutionPreferences,
    deliveryInstructions,
    walletApplied = 0,
    deliveryType,
    paymentStatus,
    audit,
  } = input;

  if (cart.items.length === 0) {
    throw new ValidationError("cart", "Your cart is empty.");
  }

  // The client only ever proposes an amount; it can never exceed what the order
  // actually costs (a stale/tampered value asking to apply more than the total).
  if (walletApplied < 0 || walletApplied > cart.total) {
    throw new ValidationError("walletApplied", "That wallet amount doesn't match your order total.");
  }

  // Resolve the booked window (for its capacity + display snapshot) and confirm
  // the date is still inside the offered horizon — the server never trusts the
  // caller's view of what's bookable, and an admin's view is a caller's too.
  const windows = await deps.slotRepo.listWindows();
  const window = windows.find((w) => w.id === deliveryWindowId);
  if (!window || !isWithinHorizon(deliveryDate)) {
    throw new SlotUnavailableError("That delivery time is no longer available.");
  }

  const items: Array<Omit<OrderItem, "id">> = cart.items.map((line) => {
    const { product, quantity } = line;
    return {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      quantity,
      // Snapshot the unit price so a later substitution refund uses the amount
      // actually charged, not today's catalog price.
      price: product.price,
      substitutionPreference:
        substitutionPreferences?.[product.id] ?? DEFAULT_SUBSTITUTION_PREFERENCE,
      // Snapshot the product's tax exemption and this line's VAT share — both at
      // purchase time, so a later catalog or rate change can't rewrite the record.
      taxExempt: product.taxExempt,
      taxAmount: lineTaxAmount(cart, line),
    };
  });

  // The order's id, minted here rather than by the repository, because the stock
  // claimed below is attributed to this order and the claim has to happen before
  // the order exists. `crypto` is the platform global, not a Node import — the
  // domain stays framework-free.
  const orderId = crypto.randomUUID();

  const stockLines = cart.items.map(({ product, quantity }) => ({
    productId: product.id,
    name: product.name,
    quantity,
  }));

  return deps.uow.run(async ({ products, slots, orders, wallets }) => {
    await products.decrementStock(stockLines, { reason: "sale", orderId });

    // One unit of the slot's capacity (atomic guard). A full window is refused
    // here, so the slot is never overbooked.
    const claimed = await slots.claim(deliveryDate, window.id, window.capacity);
    if (!claimed) {
      // The window filled up while we were claiming stock. Throwing rolls the
      // stock decrement back with it — no release to write, and none to fail.
      throw new SlotUnavailableError(`${slotLabel(deliveryDate, window)} is fully booked.`);
    }

    if (walletApplied > 0) {
      // Guarded decrement: the balance check and the write are atomic, so a
      // wallet spent from two checkouts at once can never go negative. Throwing
      // rolls back the stock and slot claims above with it.
      const debited = await wallets.deductFunds(userId, walletApplied);
      if (!debited) throw new InsufficientWalletBalanceError();
    }

    return orders.createOrder({
      id: orderId,
      userId,
      status: "processing",
      phase: "current",
      deliveryType,
      paymentStatus,
      stage: "confirmed",
      placedAt: new Date().toISOString(),
      location,
      locationLabel,
      destination,
      city,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total,
      taxAmount: cart.taxAmount,
      taxRate: cart.taxRate,
      deliveryDate,
      deliveryWindowId: window.id,
      deliveryWindow: slotLabel(deliveryDate, window),
      deliveryInstructions,
      walletApplied,
      items,
    }, audit);
  });
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
