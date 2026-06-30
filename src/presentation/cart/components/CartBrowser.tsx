"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Cart } from "@/src/domain/entities/Cart";
import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { ConfirmSheet } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { cartsApi } from "../cart-api";
import { CartItemCard } from "./CartItemCard";
import { CartSummaryBar } from "./CartSummaryBar";
import { CartEmptyState } from "./CartEmptyState";
import { CheckoutSheet } from "./CheckoutSheet";

/** Upper bound for a single line's quantity (the server enforces the same cap). */
const MAX_QUANTITY = 99;

interface CartBrowserProps {
  cart: Cart;
  appliedPromo: PromoCode | null;
  /** Open the checkout sheet on mount (e.g. after applying a promo). */
  initialCheckoutOpen: boolean;
}

/**
 * Interactive cart + checkout. The server-rendered `cart` is the single source of
 * truth — quantity bumps and removals persist through the cart API and then
 * `router.refresh()` re-runs the server render, so the totals (subtotal, discount,
 * shipping, total) are always the server's, never recomputed on the client.
 */
export function CartBrowser({ cart, appliedPromo, initialCheckoutOpen }: CartBrowserProps) {
  const router = useRouter();
  const [pendingRemovalId, setPendingRemovalId] = React.useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(initialCheckoutOpen);
  const [pending, startTransition] = React.useTransition();

  const items = cart.items;
  const isEmpty = items.length === 0;
  const pendingProduct = items.find((item) => item.product.id === pendingRemovalId)?.product;

  // Run a cart mutation, then re-fetch the server cart so totals stay authoritative.
  // A failure leaves the cart as the server has it (no toast system yet).
  const mutate = (action: () => Promise<void>) => {
    if (pending) return;
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        // Swallowed: the displayed cart already reflects the server's last state.
      }
    });
  };

  const increment = (productId: string, quantity: number) => {
    if (quantity >= MAX_QUANTITY) return;
    mutate(() => cartsApi.setQuantity(productId, quantity + 1));
  };

  const confirmRemoval = () => {
    if (pendingRemovalId == null) return;
    const productId = pendingRemovalId;
    setPendingRemovalId(null);
    mutate(() => cartsApi.removeItem(productId));
  };

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
                  onIncrement={() => increment(item.product.id, item.quantity)}
                  onRemove={() => setPendingRemovalId(item.product.id)}
                />
              </li>
            ))}
          </ul>

          <CartSummaryBar total={cart.total} onCheckout={() => setCheckoutOpen(true)} />

          <CheckoutSheet
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            appliedPromo={appliedPromo}
            subtotal={cart.subtotal}
            shipping={cart.shipping}
            discount={cart.discount}
            total={cart.total}
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
