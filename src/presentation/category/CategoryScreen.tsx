import type { Category } from "@/src/domain/entities/Category";
import { CategoryGrid } from "@/src/presentation/category/components";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";

interface CategoryScreenProps {
  categories: Category[];
}

export default function CategoryScreen({ categories }: CategoryScreenProps) {
  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      <PageHeader title="All Categories" />

      <SearchBar
        placeholder={
          <>
            Search on <span className="text-body-b2 text-primary">FRESH DROP</span>
          </>
        }
      />

      <CategoryGrid categories={categories} title="All Categories" />
    </div>
  );
}
