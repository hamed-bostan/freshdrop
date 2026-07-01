import { notFound } from "next/navigation";
import { productsServerApi } from "@/src/presentation/product/product-server-api";
import { reviewsServerApi } from "@/src/presentation/product/review-server-api";
import { favoritesServerApi } from "@/src/presentation/favorites/favorite-server-api";
import ProductDetailScreen from "@/src/presentation/product/ProductDetailScreen";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// Product and reviews are fetched from the REST API at request time (BFF) — render
// dynamically.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const product = await productsServerApi.getById(id);
  if (!product) notFound();

  const [similar, reviews, isFavorite] = await Promise.all([
    productsServerApi.listSimilar(id),
    reviewsServerApi.listByProduct(id),
    favoritesServerApi.isFavorite(id),
  ]);

  return (
    <ProductDetailScreen product={product} similar={similar} reviews={reviews} initialFavorite={isFavorite} />
  );
}
