import type { Product } from "@/src/domain/entities/Product";
import { SectionHeader } from "@/src/presentation/components/SectionHeader";
import { ProductGrid } from "@/src/presentation/product/components";

interface SpecialOffersProps {
  products: Product[];
}

export function SpecialOffers({ products }: SpecialOffersProps) {
  return (
    <section aria-labelledby="special-offers-heading">
      <SectionHeader
        id="special-offers-heading"
        title="Special Offers"
        href="/products/special-offers"
        className="mb-4"
      />
      <ProductGrid products={products} />
    </section>
  );
}
