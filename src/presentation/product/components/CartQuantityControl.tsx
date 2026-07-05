"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
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
  /**
   * Add-to-cart only: a one-shot toggle instead of the − / ＋ stepper. Tapping adds
   * the product (the button shows an "added" check); tapping again removes it. The
   * quantity can never climb past one. Used on the home, category, and
   * "Similar To This Item" grids, where quantity is adjusted elsewhere.
   */
  addOnly?: boolean;
}

/**
 * The grocery-style cart control: an "Add" affordance that, once the product is in
 * the cart, morphs into a − / quantity / ＋ stepper bound directly to the cart
 * line (reducing to 0 removes it). Reads its quantity from the shared cart cache
 * and writes through the optimistic mutation, so every instance of a product —
 * grid tile, detail page, nav badge — updates on the same tap. A 401 means the
 * caller isn't signed in, so we send them to login and return here after.
 */
export function CartQuantityControl({
  product,
  disabled = false,
  layout = "compact",
  addOnly = false,
}: CartQuantityControlProps) {
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

  // Add-only: a one-shot toggle, never the stepper. Tapping adds the product (the
  // button becomes an "added" check); tapping again removes it. Quantity stays at one.
  if (addOnly) {
    const added = quantity > 0;
    return (
      <Button
        size="sm"
        iconOnly
        aria-label={added ? `Remove ${product.name} from cart` : `Add ${product.name} to cart`}
        aria-pressed={added}
        variant={added ? "outline" : "primary"}
        className="rounded-full"
        disabled={disabled && !added}
        onClick={() => change(added ? 0 : 1)}
      >
        <Icon icon={added ? Check : Plus} size="md" />
      </Button>
    );
  }

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
