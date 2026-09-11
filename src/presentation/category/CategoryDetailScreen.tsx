import { getTranslations } from "next-intl/server";

import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { ProductGrid } from "@/src/presentation/product/components";

import styles from "./category-detail.module.css";

interface CategoryDetailScreenProps {
  category: Category;
  products: Product[];
}

export default async function CategoryDetailScreen({ category, products }: CategoryDetailScreenProps) {
  const t = await getTranslations("search");

  return (
    <div className={styles.page}>
      {/* category.name is catalog content, localized per-locale by the repository. */}
      <PageHeader title={category.name} backHref="/category" />

      <div className={styles.content}>
        <SearchBar
          hideFilter
          placeholder={t.rich("brandHint", {
            brand: (chunks) => <span className="text-body-b2 text-primary">{chunks}</span>,
          })}
        />

        <ProductGrid products={products} addOnly />
      </div>
    </div>
  );
}
