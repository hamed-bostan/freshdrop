import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import {
  Button,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

type CategoriesTableProps = {
  categories: Category[];
};

/** Admin list of categories with per-row edit + delete actions. */
export async function CategoriesTable({ categories }: CategoriesTableProps) {
  const t = await getTranslations("dashCategories");

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("colIcon")}</TableHead>
            <TableHead>{t("colName")}</TableHead>
            <TableHead>{t("colSlug")}</TableHead>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                  <Image src={category.iconUrl} alt="" width={32} height={32} className="object-contain" />
                </div>
              </TableCell>
              <TableCell className="text-body-b7 text-foreground">{category.name}</TableCell>
              <TableCell className="text-body-b6 text-muted-foreground">{category.slug}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/categories/${category.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="me-1.5" />
                      {t("edit")}
                    </Link>
                  </Button>
                  <DeleteCategoryButton id={category.id} name={category.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
