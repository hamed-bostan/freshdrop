import type { Product } from "@/src/domain/entities/Product";
import { SectionHeader } from "@/src/presentation/components/SectionHeader";
import { ProductCard } from "./ProductCard";

interface SimilarProductsProps {
  products: Product[];
}

export function SimilarProducts({ products }: SimilarProductsProps) {
  return (
    <section aria-labelledby="similar-heading">
      <SectionHeader id="similar-heading" title="Similar To This Item" className="mb-4" />

      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-40 shrink-0" addOnly />
        ))}
      </div>
    </section>
  );
}
