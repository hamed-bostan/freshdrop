import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { Category } from "@/src/domain/entities/Category";

interface CategoryItemProps {
  category: Category;
}

export function CategoryItem({ category }: CategoryItemProps) {
  return (
    <Link href={`/category/${category.slug}`} className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center rounded-card-xl bg-surface-sunken p-4">
        <Image src={category.iconUrl} alt={category.name} width={70} height={70} />
      </div>
      <p className="text-center text-body-b13 text-foreground">{category.name}</p>
    </Link>
  );
}
