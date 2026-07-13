import { getTranslations } from "next-intl/server";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { ProductGrid } from "@/src/presentation/product/components";

interface CategoryDetailScreenProps {
  category: Category;
  products: Product[];
}

export default async function CategoryDetailScreen({ category, products }: CategoryDetailScreenProps) {
  const t = await getTranslations("search");

  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      {/* category.name is catalog content, localized per-locale by the repository. */}
      <PageHeader title={category.name} />

      <SearchBar
        placeholder={t.rich("brandHint", {
          brand: (chunks) => <span className="text-body-b2 text-primary">{chunks}</span>,
        })}
      />

      <ProductGrid products={products} addOnly />
    </div>
  );
}
