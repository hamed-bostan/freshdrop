export type PromoCode = {
  id: string;
  /** The code the user enters/redeems, e.g. "SNAPP15". */
  code: string;
  /** Short marketing name shown in the list, e.g. "Promo Snapp". */
  title: string;
  /** One-line explanation, e.g. "15% discount on first order". */
  description: string;
  /** Percentage taken off the subtotal. */
  discountPercent: number;
}

/**
 * A promo code as the *operator* sees it — the shopper-facing code plus the
 * campaign facts that decide whether it's live and how it's doing.
 *
 * Deliberately a separate type rather than extra fields on {@link PromoCode}: the
 * storefront's promo list and the redemption endpoint answer with the public
 * shape, and a redemption counter is not something a shopper's response body
 * should carry. The admin list is the only reader of these fields.
 */
export type AdminPromoCode = PromoCode & {
  /** The operator's on/off switch. Inactive codes are hidden from shoppers and refused at redemption. */
  active: boolean;
  /**
   * When the campaign opens — ISO 8601 (UTC). `undefined` means "already open":
   * the code is redeemable from the moment it exists.
   */
  startsAt?: string;
  /**
   * When the campaign closes — ISO 8601 (UTC). `undefined` means open-ended: the
   * code runs until someone deactivates it.
   */
  endsAt?: string;
  /**
   * How many orders have been placed with this code. Counted from the day the
   * counter shipped — orders placed before it never recorded their promo, so this
   * is "redemptions since then", not "redemptions ever".
   */
  usageCount: number;
}

/** The switch and window that decide redeemability — the subset {@link isPromoLive} reads. */
export type PromoCodeSchedule = Pick<AdminPromoCode, "active" | "startsAt" | "endsAt">;

/**
 * Whether a code may be browsed and redeemed at `now`: switched on, and inside its
 * campaign window. Pure, so the same rule applies to a row already in hand (the
 * admin table's status badge) and to the redemption path without a round trip.
 *
 * The repository filters on this same rule in SQL — this isn't the enforcement
 * point for the storefront, it's the shared definition of what that SQL means.
 */
export function isPromoLive(promo: PromoCodeSchedule, now: Date = new Date()): boolean {
  if (!promo.active) return false;
  if (promo.startsAt && new Date(promo.startsAt) > now) return false;
  // Exclusive: `endsAt` is the instant the campaign is over, not its last valid one.
  if (promo.endsAt && new Date(promo.endsAt) <= now) return false;
  return true;
}

/**
 * Which state to show against a code in the admin list. `scheduled` and `expired`
 * are both "not redeemable right now" but call for different operator responses —
 * one is waiting to start, the other is finished — so they stay distinct instead
 * of collapsing into one "inactive".
 */
export type PromoCodeStatus = "active" | "inactive" | "scheduled" | "expired";

/** The states an operator can filter the admin list by, in display order. */
export const PROMO_CODE_STATUSES = ["active", "scheduled", "expired", "inactive"] as const;

/** Classify a code into the state the admin table badges it with. */
export function getPromoCodeStatus(promo: PromoCodeSchedule, now: Date = new Date()): PromoCodeStatus {
  if (!promo.active) return "inactive";
  if (promo.startsAt && new Date(promo.startsAt) > now) return "scheduled";
  if (promo.endsAt && new Date(promo.endsAt) <= now) return "expired";
  return "active";
}

/** Columns the admin promo-code list can be ordered by (see `PageRequest`). */
export const ADMIN_PROMO_CODE_SORTS = ["code", "discount", "usage", "endsAt", "createdAt"] as const;

export type AdminPromoCodeSort = (typeof ADMIN_PROMO_CODE_SORTS)[number];

/** Newest campaigns first — what an operator managing them expects to see. */
export const DEFAULT_ADMIN_PROMO_CODE_SORT: AdminPromoCodeSort = "createdAt";
export const DEFAULT_ADMIN_PROMO_CODE_DIRECTION = "desc";

/** What an operator can narrow the promo-code list by. */
export type AdminPromoCodeFilters = {
  /** Free text over the code and title. */
  query?: string;
  /** Restrict to codes in one state (see {@link PromoCodeStatus}). */
  status?: PromoCodeStatus;
};
