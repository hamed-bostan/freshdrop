import { getTranslations } from "next-intl/server";
import type { Category } from "@/src/domain/entities/Category";
import { CategoryGrid } from "@/src/presentation/category/components";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";

interface CategoryScreenProps {
  categories: Category[];
}

export default async function CategoryScreen({ categories }: CategoryScreenProps) {
  const t = await getTranslations("category");
  const title = t("allCategories");

  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      <PageHeader title={title} />

      <SearchBar />

      <CategoryGrid categories={categories} title={title} />
    </div>
  );
}
