import type { Cart } from "@/src/domain/entities/Cart";
import type { PromoCode } from "@/src/domain/entities/PromoCode";

import { CartBrowser } from "./components";

interface CartScreenProps {
  cart: Cart;
  appliedPromo: PromoCode | null;
}

export default function CartScreen({ cart, appliedPromo }: CartScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-6">
      {/* CartBrowser owns the header too — its title switches to "Checkout"
          while the checkout sheet is open. Applying a promo deep-links back here
          with the sheet auto-opened so the discount is visible immediately. */}
      <CartBrowser cart={cart} appliedPromo={appliedPromo} initialCheckoutOpen={appliedPromo != null} />
    </div>
  );
}
