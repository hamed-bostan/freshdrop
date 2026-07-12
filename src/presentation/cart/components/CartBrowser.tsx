"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import type { Cart } from "@/src/domain/entities/Cart";
import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { useRouter } from "@/src/i18n/navigation";
import { ConfirmSheet, Icon } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { cartsApi } from "../cart-api";
import { useCart } from "../CartProvider";
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
  const t = useTranslations("cart");
  const router = useRouter();
  const { refresh } = useCart();
  const [pendingRemovalId, setPendingRemovalId] = React.useState<string | null>(null);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(initialCheckoutOpen);
  const [pending, startTransition] = React.useTransition();

  const items = cart.items;
  const isEmpty = items.length === 0;
  const pendingProduct = items.find((item) => item.product.id === pendingRemovalId)?.product;

  // Run a cart mutation, then re-fetch the server cart so totals (with any promo)
  // stay authoritative, and resync the shared cart store so the nav badge reflects
  // the change too. A failure leaves the cart as the server has it.
  const mutate = (action: () => Promise<void>) => {
    if (pending) return;
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        await refresh();
      } catch {
        // Swallowed: the displayed cart already reflects the server's last state.
      }
    });
  };

  const increment = (productId: string, quantity: number, stock: number) => {
    // Never past the line cap or what's on hand — the server enforces both.
    if (quantity >= MAX_QUANTITY || quantity >= stock) return;
    mutate(() => cartsApi.setQuantity(productId, quantity + 1));
  };

  const decrement = (productId: string, quantity: number) => {
    // Floor at one — clearing the line goes through the trash (with confirmation).
    if (quantity <= 1) return;
    mutate(() => cartsApi.setQuantity(productId, quantity - 1));
  };

  const confirmRemoval = () => {
    if (pendingRemovalId == null) return;
    const productId = pendingRemovalId;
    setPendingRemovalId(null);
    mutate(() => cartsApi.removeItem(productId));
  };

  const confirmClear = () => {
    setClearOpen(false);
    mutate(() => cartsApi.clear());
  };

  return (
    <>
      <PageHeader title={checkoutOpen ? t("checkoutTitle") : t("myCart")} />

      {isEmpty ? (
        <CartEmptyState />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-body-b9 text-muted-foreground">
              {t("itemCount", { count: items.length })}
            </span>
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              className="flex items-center gap-1.5 rounded-pill px-1 py-0.5 text-body-b8 text-destructive transition-colors active:bg-error"
            >
              <Icon icon={Trash2} size="sm" />
              {t("clearAll")}
            </button>
          </div>

          <ul className="flex flex-col gap-4 pb-52">
            {items.map((item) => (
              <li key={item.product.id}>
                <CartItemCard
                  item={item}
                  onIncrement={() => increment(item.product.id, item.quantity, item.product.stockQuantity)}
                  onDecrement={() => decrement(item.product.id, item.quantity)}
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
        title={t("removeTitle")}
        message={pendingProduct ? t("removeMessage", { name: pendingProduct.name }) : undefined}
        confirmLabel={t("removeConfirm")}
        onConfirm={confirmRemoval}
      />

      <ConfirmSheet
        open={clearOpen}
        onOpenChange={setClearOpen}
        title={t("clearTitle")}
        message={t("clearMessage")}
        confirmLabel={t("clearAll")}
        onConfirm={confirmClear}
      />
    </>
  );
}
