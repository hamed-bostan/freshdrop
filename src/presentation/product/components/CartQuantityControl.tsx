"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import type { Product } from "@/src/domain/entities/Product";
import { ApiError } from "@/src/lib/api/ApiError";
import { cn } from "@/src/lib/utils";
import { useCart } from "@/src/presentation/cart/CartProvider";

/** Upper bound for a single line's quantity (the server enforces the same cap). */
const MAX_QUANTITY = 99;

interface CartQuantityControlProps {
  product: Product;
  /** Out of stock — the item can't be added (an existing line can still be reduced). */
  disabled?: boolean;
  /** `compact` = the round control on a product card; `block` = the full-width control on the detail page. */
  layout?: "compact" | "block";
}

/**
 * The grocery-style cart control: an "Add" affordance that, once the product is in
 * the cart, morphs into a − / quantity / ＋ stepper bound directly to the cart
 * line (reducing to 0 removes it). Reads its quantity from the shared cart cache
 * and writes through the optimistic mutation, so every instance of a product —
 * grid tile, detail page, nav badge — updates on the same tap. A 401 means the
 * caller isn't signed in, so we send them to login and return here after.
 */
export function CartQuantityControl({ product, disabled = false, layout = "compact" }: CartQuantityControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getQuantity, setItemQuantity } = useCart();
  const quantity = getQuantity(product.id);

  const atStockLimit = quantity >= product.stockQuantity;

  const change = (next: number) => {
    setItemQuantity(product, next).catch((error: unknown) => {
      // A signed-out caller gets a 401 — send them to login, returning here after.
      if (error instanceof ApiError && error.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }
    });
  };

  const block = layout === "block";

  // Nothing in the cart yet — show the "Add" affordance.
  if (quantity === 0) {
    if (block) {
      return (
        <Button size="lg" className="w-full gap-2" disabled={disabled} onClick={() => change(1)}>
          Add to Cart
          <Icon icon={Plus} size="sm" />
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        iconOnly
        aria-label={`Add ${product.name} to cart`}
        className="rounded-full"
        disabled={disabled}
        onClick={() => change(1)}
      >
        <Icon icon={Plus} size="md" />
      </Button>
    );
  }

  const decrement = () => change(quantity - 1);
  const increment = () => {
    if (quantity >= MAX_QUANTITY || atStockLimit || disabled) return;
    change(quantity + 1);
  };
  const canIncrement = quantity < MAX_QUANTITY && !atStockLimit && !disabled;

  return (
    <div
      className={cn(
        "flex items-center bg-primary text-primary-foreground",
        block ? "h-12 w-full justify-between rounded-button px-2" : "h-10 gap-1 rounded-full px-1",
      )}
    >
      <button
        type="button"
        onClick={decrement}
        aria-label={`Decrease ${product.name} quantity`}
        className={cn(
          "grid place-items-center rounded-full transition-colors active:bg-primary-pressed",
          block ? "size-10" : "size-8",
        )}
      >
        <Icon icon={Minus} size="sm" />
      </button>

      <span aria-live="polite" className={cn("text-center", block ? "text-button-btn4" : "min-w-5 text-body-b4")}>
        {quantity}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={!canIncrement}
        aria-label={`Increase ${product.name} quantity`}
        className={cn(
          "grid place-items-center rounded-full transition-colors active:bg-primary-pressed disabled:opacity-40 disabled:active:bg-transparent",
          block ? "size-10" : "size-8",
        )}
      >
        <Icon icon={Plus} size="sm" />
      </button>
    </div>
  );
}
