import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import { Button, Icon } from "@/src/presentation/design-system";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

type CategoriesTableProps = {
  categories: Category[];
  /** Called after a row is deleted via the API, so the parent can drop it from its list. */
  onDeleted: (id: string) => void;
};

/** Admin list of categories with per-row edit + delete actions. */
export function CategoriesTable({ categories, onDeleted }: CategoriesTableProps) {
  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <table className="w-full text-left">
        <thead className="bg-surface-sunken text-body-b8 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Icon</th>
            <th scope="col" className="px-4 py-3">Name</th>
            <th scope="col" className="px-4 py-3">Slug</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {categories.map((category) => (
            <tr key={category.id} className="bg-background">
              <td className="px-4 py-3">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                  <Image src={category.iconUrl} alt="" width={32} height={32} className="object-contain" />
                </div>
              </td>
              <td className="px-4 py-3 text-body-b7 text-foreground">{category.name}</td>
              <td className="px-4 py-3 text-body-b6 text-muted-foreground">{category.slug}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/${category.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="mr-1.5" />
                      Edit
                    </Link>
                  </Button>
                  <DeleteCategoryButton
                    id={category.id}
                    name={category.name}
                    onDeleted={() => onDeleted(category.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
