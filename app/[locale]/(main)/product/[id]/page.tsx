import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productsServerApi } from "@/src/presentation/product/product-server-api";
import { reviewsServerApi } from "@/src/presentation/product/review-server-api";
import { favoritesServerApi } from "@/src/presentation/favorites/favorite-server-api";
import { stockAlertsServerApi } from "@/src/presentation/product/stock-alert-server-api";
import ProductDetailScreen from "@/src/presentation/product/ProductDetailScreen";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// Product and reviews are fetched from the REST API at request time (BFF) — render
// dynamically.
export const dynamic = "force-dynamic";

// Per-request memo so `generateMetadata` and the page render share one BFF fetch.
const getProduct = cache((id: string) => productsServerApi.getById(id));

/**
 * Localized document metadata: the product's (translated) name fills the layout's
 * `%s · FreshDrop` title template; its description, when authored, replaces the
 * generic site description. A missing product contributes nothing — the page render
 * 404s right after.
 */
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return {};

  return {
    title: product.name,
    ...(product.description ? { description: product.description } : {}),
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const product = await getProduct(id);
  if (!product) notFound();

  const [similar, reviews, isFavorite, isStockAlertSubscribed] = await Promise.all([
    productsServerApi.listSimilar(id),
    reviewsServerApi.listByProduct(id),
    favoritesServerApi.isFavorite(id),
    stockAlertsServerApi.isSubscribed(id),
  ]);

  return (
    <ProductDetailScreen
      product={product}
      similar={similar}
      reviews={reviews}
      initialFavorite={isFavorite}
      initialStockAlert={isStockAlertSubscribed}
    />
  );
}
