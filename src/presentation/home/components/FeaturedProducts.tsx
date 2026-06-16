import type { Product } from "@/src/domain/entities/Product";
import { SectionHeader } from "@/src/presentation/components/SectionHeader";
import { ProductGrid } from "@/src/presentation/product/components";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section aria-labelledby="featured-heading">
      <SectionHeader id="featured-heading" title="Featured Products" href="/products/featured" className="mb-4" />
      <ProductGrid products={products} />
    </section>
  );
}
