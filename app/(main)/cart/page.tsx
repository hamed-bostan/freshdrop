import { GetCart } from "@/src/domain/use-cases/cart/GetCart";
import { FindPromoCode } from "@/src/domain/use-cases/promo-codes/FindPromoCode";
import { cartRepository, promoCodeRepository } from "@/src/infrastructure/container";
import CartScreen from "@/src/presentation/cart/CartScreen";

interface CartPageProps {
  searchParams: Promise<{ promo?: string }>;
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const { promo: code } = await searchParams;

  // A promo applied from the promo screen arrives as a `?promo=` code; resolve
  // it so the discount is reflected in the cart total and checkout summary.
  const appliedPromo = code ? await new FindPromoCode(promoCodeRepository).execute(code) : null;
  const cart = await new GetCart(cartRepository).execute({ promo: appliedPromo });

  return <CartScreen cart={cart} appliedPromo={appliedPromo} />;
}
