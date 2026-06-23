import type { Product } from "@/src/domain/entities/Product";
import type { Category } from "@/src/domain/entities/Category";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { FavoritesBrowser, FavoritesEmptyState } from "./components";

interface FavoritesScreenProps {
  favorites: Product[];
  categories: Category[];
}

export default function FavoritesScreen({ favorites, categories }: FavoritesScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col px-6 pb-24">
      <PageHeader title="Favorites" />

      {favorites.length > 0 ? (
        <FavoritesBrowser favorites={favorites} categories={categories} />
      ) : (
        <FavoritesEmptyState />
      )}
    </div>
  );
}
