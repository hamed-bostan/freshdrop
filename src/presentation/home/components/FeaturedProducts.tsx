import { getTranslations } from "next-intl/server";
import type { Product } from "@/src/domain/entities/Product";
import { SectionHeader } from "@/src/presentation/components/SectionHeader";
import { ProductGrid } from "@/src/presentation/product/components";

interface FeaturedProductsProps {
  products: Product[];
}

export async function FeaturedProducts({ products }: FeaturedProductsProps) {
  const t = await getTranslations("home");

  return (
    <section aria-labelledby="featured-heading">
      <SectionHeader id="featured-heading" title={t("featured")} href="/products/featured" className="mb-4" />
      <ProductGrid products={products} addOnly />
    </section>
  );
}
