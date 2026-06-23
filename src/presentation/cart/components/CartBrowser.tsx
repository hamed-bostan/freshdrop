"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Cart, CartItem } from "@/src/domain/entities/Cart";
import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { ConfirmSheet } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { promoDiscount } from "@/src/lib/promoDiscount";
import { CartItemCard } from "./CartItemCard";
import { CartSummaryBar } from "./CartSummaryBar";
import { CartEmptyState } from "./CartEmptyState";
import { CheckoutSheet } from "./CheckoutSheet";

/** Upper bound for a single line's quantity. */
const MAX_QUANTITY = 99;

interface CartBrowserProps {
  cart: Cart;
  appliedPromo: PromoCode | null;
  /** Open the checkout sheet on mount (e.g. after applying a promo). */
  initialCheckoutOpen: boolean;
}

/**
 * Interactive cart + checkout. Owns the item/quantity state over the
 * server-provided cart so increments and removals are instant; the subtotal,
 * discount and total recompute locally (shipping is a flat fee from the server).
 * Mutations and checkout aren't persisted yet — UI-only, like the rest of the
 * app for now.
 */
export function CartBrowser({ cart, appliedPromo, initialCheckoutOpen }: CartBrowserProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<CartItem[]>(cart.items);
  const [pendingRemovalId, setPendingRemovalId] = React.useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(initialCheckoutOpen);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedPromo ? promoDiscount(subtotal, appliedPromo.discountPercent) : 0;
  const total = subtotal + cart.shipping - discount;

  const increment = (productId: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) }
          : item,
      ),
    );

  const confirmRemoval = () => {
    if (pendingRemovalId == null) return;
    setItems((prev) => prev.filter((item) => item.product.id !== pendingRemovalId));
  };

  const pendingProduct = items.find((item) => item.product.id === pendingRemovalId)?.product;
  const isEmpty = items.length === 0;

  return (
    <>
      <PageHeader title={checkoutOpen ? "Checkout" : "My Cart"} />

      {isEmpty ? (
        <CartEmptyState />
      ) : (
        <>
          <ul className="flex flex-col gap-4 pb-52">
            {items.map((item) => (
              <li key={item.product.id}>
                <CartItemCard
                  item={item}
                  onIncrement={() => increment(item.product.id)}
                  onRemove={() => setPendingRemovalId(item.product.id)}
                />
              </li>
            ))}
          </ul>

          <CartSummaryBar total={total} onCheckout={() => setCheckoutOpen(true)} />

          <CheckoutSheet
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            appliedPromo={appliedPromo}
            subtotal={subtotal}
            shipping={cart.shipping}
            discount={discount}
            total={total}
            onConfirm={() =>
              router.push(
                appliedPromo ? `/cart/checkout?promo=${encodeURIComponent(appliedPromo.code)}` : "/cart/checkout",
              )
            }
          />
        </>
      )}

      <ConfirmSheet
        open={pendingRemovalId != null}
        onOpenChange={(open) => {
          if (!open) setPendingRemovalId(null);
        }}
        title="Remove from cart?"
        message={pendingProduct ? `Remove ${pendingProduct.name} from your cart?` : undefined}
        confirmLabel="Remove"
        onConfirm={confirmRemoval}
      />
    </>
  );
}
