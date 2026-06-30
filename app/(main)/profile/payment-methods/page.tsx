import PaymentMethodScreen from "@/src/presentation/payment/PaymentMethodScreen";
import { paymentMethodsServerApi } from "@/src/presentation/payment/payment-method-server-api";
import { walletsServerApi } from "@/src/presentation/wallet/wallet-server-api";

// The catalog is reference data and the saved cards are per-user — both fetched
// from the REST API at request time (BFF).
export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  // The option catalog (public) and the caller's saved cards (per-user) are
  // independent reads, fetched together.
  const [methods, cards] = await Promise.all([paymentMethodsServerApi.list(), walletsServerApi.listCards()]);

  return <PaymentMethodScreen methods={methods} cards={cards} />;
}
