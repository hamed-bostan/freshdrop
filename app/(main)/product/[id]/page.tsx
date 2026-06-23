import { notFound } from "next/navigation";
import { GetProductById } from "@/src/domain/use-cases/products/GetProductById";
import { GetSimilarProducts } from "@/src/domain/use-cases/products/GetSimilarProducts";
import { GetProductReviews } from "@/src/domain/use-cases/reviews/GetProductReviews";
import { productRepository, reviewRepository } from "@/src/infrastructure/container";
import ProductDetailScreen from "@/src/presentation/product/ProductDetailScreen";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const product = await new GetProductById(productRepository).execute(id);
  if (!product) notFound();

  const [similar, reviews] = await Promise.all([
    new GetSimilarProducts(productRepository).execute(id),
    new GetProductReviews(reviewRepository).execute(id),
  ]);

  return <ProductDetailScreen product={product} similar={similar} reviews={reviews} />;
}
