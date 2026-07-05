import { cartsServerApi } from "@/src/presentation/cart/cart-server-api";
import { promoCodesServerApi } from "@/src/presentation/cart/promo-code-server-api";
import { deliveryLocationsServerApi } from "@/src/presentation/delivery-location/delivery-location-server-api";
import { deliverySlotsServerApi } from "@/src/presentation/checkout/delivery-slot-server-api";
import { paymentMethodsServerApi } from "@/src/presentation/payment/payment-method-server-api";
import { walletsServerApi } from "@/src/presentation/wallet/wallet-server-api";
import CheckoutScreen from "@/src/presentation/checkout/CheckoutScreen";

interface CheckoutPageProps {
  searchParams: Promise<{ promo?: string }>;
}

// Cart, promo, delivery locations/slots, the payment-option catalog, the caller's
// saved cards and their current selection all come from the REST API (BFF).
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { promo: code } = await searchParams;

  // Carry any promo applied in the cart through to checkout so the totals match:
  // the cart is fetched with it applied, and resolved separately for the summary.
  const [cart, appliedPromo, deliveryLocations, deliverySlotDays, paymentMethods, savedCards, selectedPaymentMethodId] =
    await Promise.all([
      cartsServerApi.get({ promo: code }),
      code ? promoCodesServerApi.getByCode(code) : Promise.resolve(null),
      deliveryLocationsServerApi.list(),
      deliverySlotsServerApi.list(),
      paymentMethodsServerApi.list(),
      walletsServerApi.listCards(),
      paymentMethodsServerApi.getSelectedId(),
    ]);

  return (
    <CheckoutScreen
      cart={cart}
      deliveryLocations={deliveryLocations}
      deliverySlotDays={deliverySlotDays}
      paymentMethods={paymentMethods}
      savedCards={savedCards}
      selectedPaymentMethodId={selectedPaymentMethodId}
      promoCode={appliedPromo?.code}
    />
  );
}
