/** Money taken off `subtotal` by a percentage promo, rounded to whole cents. */
export function promoDiscount(subtotal: number, discountPercent: number): number {
  return Math.round(subtotal * discountPercent) / 100;
}
