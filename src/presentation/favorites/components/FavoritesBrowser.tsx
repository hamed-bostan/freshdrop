"use client";

import * as React from "react";
import type { Product } from "@/src/domain/entities/Product";
import type { Category } from "@/src/domain/entities/Category";
import { ProductGrid } from "@/src/presentation/product/components";
import { ALL_FILTER, FavoriteFilterTabs } from "./FavoriteFilterTabs";

interface FavoritesBrowserProps {
  favorites: Product[];
  categories: Category[];
}

/**
 * Populated favorites view: a category filter over the user's favorites and the
 * resulting product grid. Filtering is client-side so tab switches are instant.
 */
export function FavoritesBrowser({ favorites, categories }: FavoritesBrowserProps) {
  const [selected, setSelected] = React.useState<string>(ALL_FILTER);

  // Offer only the categories the user actually has favorites in, in catalog order.
  const availableCategories = React.useMemo(() => {
    const presentIds = new Set(favorites.map((product) => product.categoryId));
    return categories.filter((category) => presentIds.has(category.id));
  }, [favorites, categories]);

  const visible =
    selected === ALL_FILTER ? favorites : favorites.filter((product) => product.categoryId === selected);

  // Everything here is favorited by definition, so every card's heart starts filled.
  const favoriteIds = React.useMemo(() => new Set(favorites.map((product) => product.id)), [favorites]);

  return (
    <div className="mt-4 flex flex-col gap-5">
      <FavoriteFilterTabs categories={availableCategories} value={selected} onValueChange={setSelected} />
      <ProductGrid products={visible} favoriteToggle favoriteIds={favoriteIds} refreshOnUnfavorite />
    </div>
  );
}
