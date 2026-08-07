import { paymentMethodsServerApi } from "@/src/presentation/payment/payment-method-server-api";
import PaymentMethodScreen from "@/src/presentation/payment/PaymentMethodScreen";
import { walletsServerApi } from "@/src/presentation/wallet/wallet-server-api";

// The catalog is reference data and the saved cards are per-user — both fetched
// from the REST API at request time (BFF).
export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  // The option catalog (public), the caller's saved cards and their current
  // selection (both per-user) are independent reads, fetched together.
  const [methods, cards, selectedId] = await Promise.all([
    paymentMethodsServerApi.list(),
    walletsServerApi.listCards(),
    paymentMethodsServerApi.getSelectedId(),
  ]);

  return <PaymentMethodScreen methods={methods} cards={cards} selectedId={selectedId} />;
}
