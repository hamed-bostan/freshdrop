"use client";

import { Star } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import { CartQuantityControl } from "./CartQuantityControl";
import { BackInStockButton } from "./BackInStockButton";

interface ProductPurchasePanelProps {
  product: Product;
  /** Whether the signed-in user is subscribed to this product's back-in-stock alert. */
  initialStockAlert: boolean;
}

/**
 * Name / rating / unit summary card with the price and the cart control. In stock,
 * the control is the grocery-style Add ↔ − / quantity / ＋ stepper bound to the
 * cart line (see CartQuantityControl) — adding keeps the user on the page and the
 * nav badge reflects it, rather than bouncing to the cart. Out of stock swaps in
 * the back-in-stock subscribe button.
 */
export function ProductPurchasePanel({ product, initialStockAlert }: ProductPurchasePanelProps) {
  const hasDiscount = product.originalPrice != null;
  const stock = getStockStatus(product.stockQuantity);
  const outOfStock = stock.level === "out";

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

        <div className="mt-4 flex items-baseline justify-end gap-2">
          {hasDiscount && (
            <span className="text-body-b1 text-muted-foreground line-through">
              ${product.originalPrice!.toFixed(2)}
            </span>
          )}
          <span className="text-heading-h2 text-accent-foreground">${product.price.toFixed(2)}</span>
        </div>
      </div>

      {outOfStock ? (
        <BackInStockButton productId={product.id} initialSubscribed={initialStockAlert} />
      ) : (
        <CartQuantityControl product={product} layout="block" />
      )}
    </div>
  );
}
