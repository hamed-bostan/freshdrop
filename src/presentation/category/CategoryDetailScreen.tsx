import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { ProductGrid } from "@/src/presentation/product/components";

interface CategoryDetailScreenProps {
  category: Category;
  products: Product[];
}

export default function CategoryDetailScreen({ category, products }: CategoryDetailScreenProps) {
  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      <PageHeader title={category.name} />

      <SearchBar
        placeholder={
          <>
            Search on <span className="text-body-b2 text-primary">FRESH DROP</span>
          </>
        }
      />

      <ProductGrid products={products} />
    </div>
  );
}
