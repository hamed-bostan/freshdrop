import { notFound } from "next/navigation";
import { GetProductReviews } from "@/src/domain/use-cases/reviews/GetProductReviews";
import { reviewRepository } from "@/src/infrastructure/container";
import { productsServerApi } from "@/src/presentation/product/product-server-api";
import { favoritesServerApi } from "@/src/presentation/favorites/favorite-server-api";
import ProductDetailScreen from "@/src/presentation/product/ProductDetailScreen";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// Product is fetched from the REST API at request time — render dynamically.
// NOTE: reviews still read the data layer directly until their REST stage lands.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const product = await productsServerApi.getById(id);
  if (!product) notFound();

  const [similar, reviews, isFavorite] = await Promise.all([
    productsServerApi.listSimilar(id),
    new GetProductReviews(reviewRepository).execute(id),
    favoritesServerApi.isFavorite(id),
  ]);

  return (
    <ProductDetailScreen product={product} similar={similar} reviews={reviews} initialFavorite={isFavorite} />
  );
}
