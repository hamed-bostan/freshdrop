import type { DeliveryWindow } from "../entities/DeliveryWindow";

/** Key for a per-(date, window) booking count: `${date}#${windowId}`. */
export function bookedCountKey(date: string, windowId: string): string {
  return `${date}#${windowId}`;
}

/**
 * A delivery window's editable fields — everything but the id, which is an
 * operator-authored slug fixed at creation. Renaming it would orphan the booking
 * ledger rows and the window reference on every order that booked it, so the
 * update path can't reach it.
 */
export type DeliveryWindowInput = Omit<DeliveryWindow, "id">;

export type IDeliverySlotRepository = {
  /** The recurring window catalog, ordered by display position. */
  listWindows(): Promise<DeliveryWindow[]>;

  /**
   * Orders already booked per (date, window) across `dates`, keyed by
   * {@link bookedCountKey}. Missing pairs are absent (treated as 0) — the checkout
   * availability read subtracts these from each window's capacity.
   */
  getBookedCounts(dates: string[]): Promise<Record<string, number>>;

  /**
   * Atomically claim one unit of capacity for `(date, windowId)`, returning `true`
   * when a unit was taken and `false` when the window is already full. The
   * capacity check and the increment are one guarded write (`booked < capacity`),
   * so concurrent placements can never oversell a slot — the same oversell guard
   * the atomic stock decrement uses.
   */
  claim(date: string, windowId: string, capacity: number): Promise<boolean>;

  /**
   * Give back one unit of capacity claimed by {@link claim} — the compensating
   * action when the checkout that took it doesn't go on to produce an order.
   *
   * A slot claim and the order that justifies it can't be written in one
   * transaction (they're separate aggregates, reached through separate ports), so
   * the seat has to be released explicitly when the step after it fails.
   * Otherwise a failed checkout silently shrinks the day's delivery capacity, and
   * the only way back is a DB console.
   *
   * Never drops below zero, so a double release can't manufacture capacity that
   * was never claimed.
   */
  release(date: string, windowId: string): Promise<void>;

  /** One window by its slug, for the admin edit form; `null` when it's gone. */
  getWindow(id: string): Promise<DeliveryWindow | null>;
  /** Add a window to the catalog. The id is the operator-authored slug. */
  createWindow(window: DeliveryWindow): Promise<DeliveryWindow>;
  updateWindow(id: string, input: DeliveryWindowInput): Promise<DeliveryWindow>;
  deleteWindow(id: string): Promise<void>;

  /**
   * How many orders are booked into this window on `fromDate` or later — the guard
   * on removing it. Past bookings block nothing (those deliveries have happened);
   * upcoming ones are customers holding a delivery time that would stop resolving
   * the moment the window disappeared.
   */
  countBookingsFrom(windowId: string, fromDate: string): Promise<number>;
};
