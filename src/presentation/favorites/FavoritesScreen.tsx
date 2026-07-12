import { getTranslations } from "next-intl/server";
import type { Product } from "@/src/domain/entities/Product";
import type { Category } from "@/src/domain/entities/Category";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { FavoritesBrowser, FavoritesEmptyState } from "./components";

interface FavoritesScreenProps {
  favorites: Product[];
  categories: Category[];
}

export default async function FavoritesScreen({ favorites, categories }: FavoritesScreenProps) {
  const t = await getTranslations("favorites");

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-24">
      <PageHeader title={t("title")} />

      {favorites.length > 0 ? (
        <FavoritesBrowser favorites={favorites} categories={categories} />
      ) : (
        <FavoritesEmptyState />
      )}
    </div>
  );
}
