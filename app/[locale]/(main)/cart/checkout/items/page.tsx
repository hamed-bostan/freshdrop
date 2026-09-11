import { cartsServerApi } from "@/src/presentation/cart/cart-server-api";
import CheckoutItemsScreen from "@/src/presentation/checkout/CheckoutItemsScreen";

interface Props { searchParams: Promise<{ promo?: string }> }

export const dynamic = "force-dynamic";

export default async function CheckoutItemsPage({ searchParams }: Props) {
  const { promo } = await searchParams;
  const cart = await cartsServerApi.get({ promo });
  return <CheckoutItemsScreen cart={cart} promoCode={promo} />;
}
