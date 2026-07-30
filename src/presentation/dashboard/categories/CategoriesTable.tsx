import Image from "next/image";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  DEFAULT_ADMIN_CATEGORY_DIRECTION,
  DEFAULT_ADMIN_CATEGORY_SORT,
} from "@/src/domain/entities/AdminCategoryFilters";
import type { Category } from "@/src/domain/entities/Category";
import {
  Badge,
  DataTable,
  DataTableFooter,
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
import { CategoryRowActions } from "./CategoryRowActions";

type CategoriesTableProps = {
  categories: Category[];
  footer?: ReactNode;
};

/**
 * The list's own default ordering, passed to every sortable header so an
 * untouched table leaves `sort`/`dir` out of the URL entirely.
 */
const SORT_DEFAULTS = {
  defaultSort: DEFAULT_ADMIN_CATEGORY_SORT,
  defaultDirection: DEFAULT_ADMIN_CATEGORY_DIRECTION,
} as const;

/** Admin category list optimized for scanning, with secondary details grouped by category. */
export async function CategoriesTable({ categories, footer }: CategoriesTableProps) {
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
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {t("colCategory")}
            </ListSortHeader>
            <ListSortHeader sortKey="productCount" align="end" initialDirection="desc" {...SORT_DEFAULTS}>
              {t("colProductCount")}
            </ListSortHeader>
            <TableHead>{t("colStatus")}</TableHead>
            <ListSortHeader sortKey="updatedAt" initialDirection="desc" {...SORT_DEFAULTS}>
              {t("colUpdatedAt")}
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
                <div className="flex items-center gap-3">
                  <Thumbnail className="size-10">
                    <Image src={category.iconUrl} alt="" width={32} height={32} className="object-contain" />
                  </Thumbnail>
                  <div className="min-w-0">
                    <p className="truncate text-body-b7 text-foreground">{category.name}</p>
                    <p className="truncate text-body-b8 text-muted-foreground">{category.slug}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-end text-body-b6">
                <Link
                  href={`/dashboard/products?categoryId=${encodeURIComponent(category.id)}`}
                  className="text-primary underline-offset-4 hover:underline"
                  aria-label={t("viewProductsAria", { name: category.name, count: category.productCount })}
                >
                  {formatNumber(category.productCount, locale)}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={category.isActive ? "success" : "neutral"}>
                  {category.isActive ? t("statusActive") : t("statusInactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-body-b6 text-muted-foreground">
                {formatOrderDateShort(category.updatedAt.toISOString(), locale)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <CategoryRowActions id={category.id} name={category.name} productCount={category.productCount} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {footer ? <DataTableFooter>{footer}</DataTableFooter> : null}
    </DataTable>
  );
}
