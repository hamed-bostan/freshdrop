import { getTranslations } from "next-intl/server";

import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { PageHeader } from "@/src/presentation/components/PageHeader";

import { FavoritesBrowser, FavoritesEmptyState } from "./components";
import styles from "./favorites.module.css";

interface FavoritesScreenProps {
  favorites: Product[];
  categories: Category[];
}

export default async function FavoritesScreen({ favorites, categories }: FavoritesScreenProps) {
  const t = await getTranslations("favorites");

  return (
    <div className={styles.page}>
      <PageHeader title={t("title")} />

      {favorites.length > 0 ? (
        <FavoritesBrowser favorites={favorites} categories={categories} />
      ) : (
        <FavoritesEmptyState />
      )}
    </div>
  );
}
