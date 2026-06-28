/**
 * A delivery speed/time the customer can choose at checkout. The `eta` is a
 * human-readable estimate (e.g. "45 - 60 Min"); pricing isn't modelled yet, so
 * the flat shipping fee on the cart is unaffected by the choice.
 */
export type DeliveryOption = {
  id: string;
  label: string;
  eta: string;
}
