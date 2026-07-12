import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import { Button, Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

type CategoriesTableProps = {
  categories: Category[];
};

/** Admin list of categories with per-row edit + delete actions. */
export async function CategoriesTable({ categories }: CategoriesTableProps) {
  const t = await getTranslations("dashCategories");

  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <table className="w-full text-start">
        <thead className="bg-surface-sunken text-body-b8 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">{t("colIcon")}</th>
            <th scope="col" className="px-4 py-3">{t("colName")}</th>
            <th scope="col" className="px-4 py-3">{t("colSlug")}</th>
            <th scope="col" className="px-4 py-3 text-end">{t("colActions")}</th>
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
                    <Link href={`/dashboard/categories/${category.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="me-1.5" />
                      {t("edit")}
                    </Link>
                  </Button>
                  <DeleteCategoryButton id={category.id} name={category.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
