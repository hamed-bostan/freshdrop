import type { Product } from "@/src/domain/entities/Product";
import type { Review } from "@/src/domain/entities/Review";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import {
  ProductGallery,
  ProductInfoAccordion,
  ProductPurchasePanel,
  ReviewSection,
  SimilarProducts,
} from "./components";

interface ProductDetailScreenProps {
  product: Product;
  similar: Product[];
  reviews: Review[];
}

export default function ProductDetailScreen({ product, similar, reviews }: ProductDetailScreenProps) {
  const galleryImages = product.images?.length ? product.images : [product.imageUrl];

  return (
    <div className="flex flex-col gap-6 px-6 pb-28">
      <PageHeader title="Product Detail" />

      <ProductGallery images={galleryImages} productName={product.name} />

      <ProductPurchasePanel product={product} />

      <ProductInfoAccordion product={product} />

      {similar.length > 0 && <SimilarProducts products={similar} />}

      <ReviewSection reviews={reviews} />
    </div>
  );
}
