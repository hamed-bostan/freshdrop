import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { Category } from "@/src/domain/entities/Category";
import { categoryHref } from "@/src/presentation/category/category-path";
import { Thumbnail } from "@/src/presentation/design-system";

interface CategoryItemProps {
  category: Category;
}

export function CategoryItem({ category }: CategoryItemProps) {
  return (
    <Link href={categoryHref(category)} className="flex flex-col items-center gap-1">
      <Thumbnail radius="xl" className="p-4">
        <Image src={category.iconUrl} alt={category.name} width={70} height={70} />
      </Thumbnail>
      <p className="text-center text-body-b13 text-foreground">{category.name}</p>
    </Link>
  );
}
