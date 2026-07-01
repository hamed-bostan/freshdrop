import { GetPaymentMethods } from "@/src/domain/use-cases/payment-methods/GetPaymentMethods";
import { paymentMethodRepository } from "@/src/infrastructure/container";
import { cartsServerApi } from "@/src/presentation/cart/cart-server-api";
import { promoCodesServerApi } from "@/src/presentation/cart/promo-code-server-api";
import { deliveryLocationsServerApi } from "@/src/presentation/delivery-location/delivery-location-server-api";
import { deliveryOptionsServerApi } from "@/src/presentation/checkout/delivery-option-server-api";
import CheckoutScreen from "@/src/presentation/checkout/CheckoutScreen";

interface CheckoutPageProps {
  searchParams: Promise<{ promo?: string }>;
}

// Cart, promo, delivery locations & delivery options come from the REST API (BFF);
// payment methods still read the data layer directly until their stage.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { promo: code } = await searchParams;

  // Carry any promo applied in the cart through to checkout so the totals match:
  // the cart is fetched with it applied, and resolved separately for the summary.
  const [cart, appliedPromo, deliveryLocations, deliveryOptions, paymentMethods] = await Promise.all([
    cartsServerApi.get({ promo: code }),
    code ? promoCodesServerApi.getByCode(code) : Promise.resolve(null),
    deliveryLocationsServerApi.list(),
    deliveryOptionsServerApi.list(),
    new GetPaymentMethods(paymentMethodRepository).execute(),
  ]);

  return (
    <CheckoutScreen
      cart={cart}
      deliveryLocations={deliveryLocations}
      deliveryOptions={deliveryOptions}
      paymentMethods={paymentMethods}
      promoCode={appliedPromo?.code}
    />
  );
}
