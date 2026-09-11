import type { AdminPromoCode } from "../../entities/PromoCode";
import type { NewPromoCode } from "../../repositories/IPromoCodeRepository";

/**
 * The fields of a campaign the activity log tracks, flattened for diffing.
 *
 * Everything an operator sets, and nothing they don't: `usageCount` is a counter
 * that redemptions move, so logging it would record a shopper's order as an admin
 * action — and would do it on every order.
 *
 * The discount, the window and the switch matter most here. A campaign is a
 * promise made to customers holding the code, so "who changed this to 5% and
 * when" is a question with money attached.
 */
export function promoCodeSnapshot(promo: AdminPromoCode | NewPromoCode): Record<string, unknown> {
  return {
    code: promo.code,
    title: promo.title,
    description: promo.description,
    discountPercent: promo.discountPercent,
    active: promo.active,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
  };
}
