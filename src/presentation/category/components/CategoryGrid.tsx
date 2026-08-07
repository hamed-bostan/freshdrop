import type { Category } from "@/src/domain/entities/Category";
import { SectionHeader } from "@/src/presentation/components/SectionHeader";

import { CategoryItem } from "./CategoryItem";

interface CategoryGridProps {
  categories: Category[];
  title: string;
  /** When provided, a "view all" link is shown next to the title. */
  href?: string;
}

export function CategoryGrid({ categories, title, href }: CategoryGridProps) {
  return (
    <section aria-labelledby="category-heading">
      <SectionHeader id="category-heading" title={title} href={href} className="mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
