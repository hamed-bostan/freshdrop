import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { Category } from "@/src/domain/entities/Category";
import { categoryHref } from "@/src/presentation/category/category-path";

interface CategoryItemProps {
  category: Category;
}

export function CategoryItem({ category }: CategoryItemProps) {
  return (
    <Link href={categoryHref(category)} className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center rounded-card-xl bg-surface-sunken p-4">
        <Image src={category.iconUrl} alt={category.name} width={70} height={70} />
      </div>
      <p className="text-center text-body-b13 text-foreground">{category.name}</p>
    </Link>
  );
}
