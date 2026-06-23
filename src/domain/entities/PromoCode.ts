export interface PromoCode {
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
