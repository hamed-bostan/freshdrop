import { GetCart } from "@/src/domain/use-cases/cart/GetCart";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import { GetDeliveryOptions } from "@/src/domain/use-cases/delivery-options/GetDeliveryOptions";
import { GetPaymentMethods } from "@/src/domain/use-cases/payment-methods/GetPaymentMethods";
import {
  cartRepository,
  promoCodeRepository,
  deliveryOptionRepository,
  paymentMethodRepository,
} from "@/src/infrastructure/container";
import { deliveryLocationsServerApi } from "@/src/presentation/delivery-location/delivery-location-server-api";
import CheckoutScreen from "@/src/presentation/checkout/CheckoutScreen";

interface CheckoutPageProps {
  searchParams: Promise<{ promo?: string }>;
}

// NOTE: delivery locations come from the REST API (BFF); cart, promo, delivery
// options & payment methods still read the data layer directly until their stages.
export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { promo: code } = await searchParams;

  // Carry any promo applied in the cart through to checkout so the totals match.
  const appliedPromo = code ? await new FindPromoCode(promoCodeRepository).execute(code) : null;

  const [cart, deliveryLocations, deliveryOptions, paymentMethods] = await Promise.all([
    new GetCart(cartRepository).execute({ promo: appliedPromo }),
    deliveryLocationsServerApi.list(),
    new GetDeliveryOptions(deliveryOptionRepository).execute(),
    new GetPaymentMethods(paymentMethodRepository).execute(),
  ]);

  return (
    <CheckoutScreen
      cart={cart}
      deliveryLocations={deliveryLocations}
      deliveryOptions={deliveryOptions}
      paymentMethods={paymentMethods}
    />
  );
}
