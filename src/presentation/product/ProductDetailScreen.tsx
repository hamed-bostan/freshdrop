import { getTranslations } from "next-intl/server";

import type { Product } from "@/src/domain/entities/Product";
import type { PublicReview } from "@/src/domain/entities/Review";
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
  reviews: PublicReview[];
  /** Whether the signed-in user has favorited this product (false when anonymous). */
  initialFavorite: boolean;
  /** Whether the signed-in user is subscribed to this product's back-in-stock alert. */
  initialStockAlert: boolean;
}

export default async function ProductDetailScreen({
  product,
  similar,
  reviews,
  initialFavorite,
  initialStockAlert,
}: ProductDetailScreenProps) {
  const t = await getTranslations("product");
  const galleryImages = product.images?.length ? product.images : [product.imageUrl];

  return (
    <div className="flex flex-col gap-6 px-6 pb-28">
      <PageHeader title={t("detailTitle")} />

      <ProductGallery
        images={galleryImages}
        productName={product.name}
        productId={product.id}
        initialFavorite={initialFavorite}
      />

      <ProductPurchasePanel product={product} initialStockAlert={initialStockAlert} />

      <ProductInfoAccordion product={product} />

      {similar.length > 0 && <SimilarProducts products={similar} />}

      <ReviewSection productId={product.id} reviews={reviews} />
    </div>
  );
}
