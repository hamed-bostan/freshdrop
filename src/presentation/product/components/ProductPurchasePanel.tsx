"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Star } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import { ApiError } from "@/src/lib/api/ApiError";
import { cartsApi } from "@/src/presentation/cart/cart-api";
import { QuantityStepper } from "./QuantityStepper";
import { BackInStockButton } from "./BackInStockButton";

interface ProductPurchasePanelProps {
  product: Product;
  /** Whether the signed-in user is subscribed to this product's back-in-stock alert. */
  initialStockAlert: boolean;
}

/**
 * Name / rating / unit summary card with a quantity stepper and price, plus the
 * "Add to Cart" action. Owns the quantity so the stepper and the cart mutation
 * share one source of truth. Adding navigates to the cart so the user sees the
 * line; a 401 (not signed in) sends them to login, returning here after.
 */
export function ProductPurchasePanel({ product, initialStockAlert }: ProductPurchasePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = React.useState(1);
  const [pending, startTransition] = React.useTransition();
  const hasDiscount = product.originalPrice != null;
  const stock = getStockStatus(product.stockQuantity);
  const outOfStock = stock.level === "out";

  function handleAddToCart() {
    if (outOfStock) return;
    startTransition(async () => {
      try {
        await cartsApi.addItem(product.id, quantity);
        router.push("/cart");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card-xl bg-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-body-b1 text-foreground">{product.name}</h2>
          {product.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1">
              <Icon icon={Star} size="xs" className="fill-rating text-rating" />
              <span className="text-body-b8 text-foreground">{product.rating}</span>
            </span>
          )}
        </div>

        {product.unit && <p className="mt-1 text-body-b6 text-muted-foreground">{product.unit}</p>}

        {stock.level === "out" && (
          <p className="mt-2 text-body-b6 text-destructive">Out of stock</p>
        )}
        {stock.level === "low" && (
          <p className="mt-2 text-body-b6 text-warning-foreground">Only {stock.quantity} left</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          {/* Cap the stepper at what's on hand so the user can't pick a quantity the
              checkout can't honour; disabled entirely when out of stock. */}
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            max={outOfStock ? 1 : product.stockQuantity}
          />

          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-body-b1 text-muted-foreground line-through">
                ${product.originalPrice!.toFixed(2)}
              </span>
            )}
            <span className="text-heading-h2 text-accent-foreground">${product.price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {outOfStock ? (
        <BackInStockButton productId={product.id} initialSubscribed={initialStockAlert} />
      ) : (
        <Button size="lg" className="w-full gap-2" onClick={handleAddToCart} disabled={pending}>
          Add to Cart
          <Icon icon={Plus} size="sm" />
        </Button>
      )}
    </div>
  );
}
