import { requireAuth } from "@/src/lib/require-auth";
import { categoriesServerApi } from "@/src/presentation/category/category-server-api";
import { favoritesServerApi } from "@/src/presentation/favorites/favorite-server-api";
import FavoritesScreen from "@/src/presentation/favorites/FavoritesScreen";

// Per-user data fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  await requireAuth();

  const [favorites, categories] = await Promise.all([
    favoritesServerApi.list(),
    categoriesServerApi.list(),
  ]);

  return <FavoritesScreen favorites={favorites} categories={categories} />;
}
