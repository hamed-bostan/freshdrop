import { requireAuth } from "@/src/lib/require-auth";
import { GetFavorites } from "@/src/domain/use-cases/favorites/GetFavorites";
import { GetCategories } from "@/src/domain/use-cases/categories/GetCategories";
import { favoriteRepository, categoryRepository } from "@/src/infrastructure/container";
import FavoritesScreen from "@/src/presentation/favorites/FavoritesScreen";

// Categories come from Postgres at request time — render dynamically (no DB at build).
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  await requireAuth();

  const [favorites, categories] = await Promise.all([
    new GetFavorites(favoriteRepository).execute(),
    new GetCategories(categoryRepository).execute(),
  ]);

  return <FavoritesScreen favorites={favorites} categories={categories} />;
}
