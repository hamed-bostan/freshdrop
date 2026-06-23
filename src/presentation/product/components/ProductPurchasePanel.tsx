"use client";

import * as React from "react";
import { Plus, Star } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import type { Product } from "@/src/domain/entities/Product";
import { QuantityStepper } from "./QuantityStepper";

interface ProductPurchasePanelProps {
  product: Product;
}

/**
 * Name / rating / unit summary card with a quantity stepper and price, plus the
 * "Add to Cart" action. Owns the quantity so the stepper and (future) cart
 * mutation share one source of truth. The add action is UI-only until the cart
 * is wired to the UI.
 */
export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = React.useState(1);
  const hasDiscount = product.originalPrice != null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card-xl bg-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-body-b1 text-foreground">{product.name}</h2>
          <span className="flex shrink-0 items-center gap-1">
            <Icon icon={Star} size="xs" className="fill-rating text-rating" />
            <span className="text-body-b8 text-foreground">{product.rating}</span>
          </span>
        </div>

        {product.unit && <p className="mt-1 text-body-b6 text-muted-foreground">{product.unit}</p>}

        <div className="mt-4 flex items-center justify-between">
          <QuantityStepper value={quantity} onChange={setQuantity} />

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

      {/* TODO: dispatch AddToCart use-case with `quantity` once the cart is wired to the UI. */}
      <Button size="lg" className="w-full gap-2">
        Add to Cart
        <Icon icon={Plus} size="sm" />
      </Button>
    </div>
  );
}
