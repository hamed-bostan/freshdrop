import type { Product } from "@/src/domain/entities/Product";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  /** Give each card an "Add"-only button (no − / ＋ stepper). */
  addOnly?: boolean;
}

export function ProductGrid({ products, addOnly = false }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} addOnly={addOnly} />
      ))}
    </div>
  );
}
