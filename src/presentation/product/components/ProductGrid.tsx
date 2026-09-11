import type { Product } from "@/src/domain/entities/Product";

import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  /** Give each card an "Add"-only button (no − / ＋ stepper). */
  addOnly?: boolean;
  /** Show a favorite heart toggle on each card — see {@link ProductCard}. */
  favoriteToggle?: boolean;
  /** IDs of favorited products; seeds each card's heart when {@link favoriteToggle} is on. */
  favoriteIds?: ReadonlySet<string>;
  /** In a favorites list, drop a card on un-favorite instead of toggling in place — see {@link ProductCard}. */
  refreshOnUnfavorite?: boolean;
}

export function ProductGrid({
  products,
  addOnly = false,
  favoriteToggle = false,
  favoriteIds,
  refreshOnUnfavorite = false,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          addOnly={addOnly}
          favoriteToggle={favoriteToggle}
          initialFavorite={favoriteIds?.has(product.id) ?? false}
          refreshOnUnfavorite={refreshOnUnfavorite}
        />
      ))}
    </div>
  );
}
