import { cartsServerApi } from "@/src/presentation/cart/cart-server-api";
import CartScreen from "@/src/presentation/cart/CartScreen";
import { promoCodesServerApi } from "@/src/presentation/cart/promo-code-server-api";

interface CartPageProps {
  searchParams: Promise<{ promo?: string }>;
}

// Cart + promo are fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: CartPageProps) {
  const { promo: code } = await searchParams;

  // A promo applied from the promo screen arrives as a `?promo=` code: the cart is
  // fetched with it applied (so totals reflect the discount) and resolved
  // separately for display in the checkout summary.
  const [cart, appliedPromo] = await Promise.all([
    cartsServerApi.get({ promo: code }),
    code ? promoCodesServerApi.getByCode(code) : Promise.resolve(null),
  ]);

  return <CartScreen cart={cart} appliedPromo={appliedPromo} />;
}
