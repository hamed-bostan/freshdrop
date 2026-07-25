import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import {
  DEFAULT_ADMIN_CATEGORY_DIRECTION,
  DEFAULT_ADMIN_CATEGORY_SORT,
} from "@/src/domain/entities/AdminCategoryFilters";
import type { Category } from "@/src/domain/entities/Category";
import {
  Badge,
  Button,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Thumbnail,
} from "@/src/presentation/design-system";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import { BulkRowCheckbox, BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import { formatOrderDateShort } from "@/src/lib/formatOrderDate";
import { formatNumber } from "@/src/lib/formatNumber";
import { Link } from "@/src/i18n/navigation";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

type CategoriesTableProps = {
  categories: Category[];
};

/**
 * The list's own default ordering, passed to every sortable header so an
 * untouched table leaves `sort`/`dir` out of the URL entirely.
 */
const SORT_DEFAULTS = {
  defaultSort: DEFAULT_ADMIN_CATEGORY_SORT,
  defaultDirection: DEFAULT_ADMIN_CATEGORY_DIRECTION,
} as const;

/** Admin list of categories with per-row edit + delete actions. */
export async function CategoriesTable({ categories }: CategoriesTableProps) {
  const t = await getTranslations("dashCategories");
  const locale = await getLocale();

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <tr>
            <TableHead className="w-10">
              <BulkSelectAllCheckbox label={t("selectAllAria")} />
            </TableHead>
            <TableHead>{t("colIcon")}</TableHead>
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {t("colName")}
            </ListSortHeader>
            <TableHead>{t("colSlug")}</TableHead>
            <ListSortHeader sortKey="productCount" align="end" initialDirection="desc" {...SORT_DEFAULTS}>
              {t("colProductCount")}
            </ListSortHeader>
            <TableHead>{t("colStatus")}</TableHead>
            <ListSortHeader sortKey="createdAt" initialDirection="desc" {...SORT_DEFAULTS}>
              {t("colCreatedAt")}
            </ListSortHeader>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <BulkRowCheckbox id={category.id} label={t("selectRowAria", { name: category.name })} />
              </TableCell>
              <TableCell>
                <Thumbnail className="size-10">
                  <Image src={category.iconUrl} alt="" width={32} height={32} className="object-contain" />
                </Thumbnail>
              </TableCell>
              <TableCell className="text-body-b7 text-foreground">{category.name}</TableCell>
              <TableCell className="text-body-b6 text-muted-foreground">{category.slug}</TableCell>
              <TableCell className="text-end text-body-b6 text-muted-foreground">
                {formatNumber(category.productCount, locale)}
              </TableCell>
              <TableCell>
                <Badge variant={category.isActive ? "success" : "neutral"}>
                  {category.isActive ? t("statusActive") : t("statusInactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-body-b6 text-muted-foreground">
                {formatOrderDateShort(category.createdAt.toISOString(), locale)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/categories/${category.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="me-1.5" />
                      {t("edit")}
                    </Link>
                  </Button>
                  <DeleteCategoryButton id={category.id} name={category.name} productCount={category.productCount} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
