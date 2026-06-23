import { GetCart } from "@/src/domain/use-cases/cart/GetCart";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { GetDeliveryOptions } from "@/src/domain/use-cases/delivery-options/GetDeliveryOptions";
import { GetPaymentMethods } from "@/src/domain/use-cases/payment-methods/GetPaymentMethods";
import {
  cartRepository,
  promoCodeRepository,
  deliveryLocationRepository,
  deliveryOptionRepository,
  paymentMethodRepository,
} from "@/src/infrastructure/container";
import CheckoutScreen from "@/src/presentation/checkout/CheckoutScreen";

interface CheckoutPageProps {
  searchParams: Promise<{ promo?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { promo: code } = await searchParams;

  // Carry any promo applied in the cart through to checkout so the totals match.
  const appliedPromo = code ? await new FindPromoCode(promoCodeRepository).execute(code) : null;

  const [cart, deliveryLocations, deliveryOptions, paymentMethods] = await Promise.all([
    new GetCart(cartRepository).execute({ promo: appliedPromo }),
    new GetDeliveryLocations(deliveryLocationRepository).execute(),
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
