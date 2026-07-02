import type { DeliveryWindow } from "../entities/DeliveryWindow";

/** Key for a per-(date, window) booking count: `${date}#${windowId}`. */
export function bookedCountKey(date: string, windowId: string): string {
  return `${date}#${windowId}`;
}

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
};
