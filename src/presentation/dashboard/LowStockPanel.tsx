import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import type { Product } from "@/src/domain/entities/Product";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { focusRing, Icon, Thumbnail } from "@/src/presentation/design-system";

import { DashboardPanel, DashboardPanelHeader } from "./DashboardPanel";

type Props = {
  products: Product[];
};

export async function LowStockPanel({ products }: Props) {
  const t = await getTranslations("dashHome");
  const locale = (await getLocale());
  return (
    <DashboardPanel className="h-full">
      <DashboardPanelHeader
        title={t("lowStockProducts")}
        action={(
          <Link href="/dashboard/inventory" className="inline-flex items-center gap-1 text-body-b8 text-primary hover:underline">
            <span className="sm:hidden">{t("viewAll")}</span>
            <span className="hidden sm:inline">{t("viewAllInventory")}</span>
            <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
          </Link>
        )}
      />
      {products.length ? (
        <ul className="mt-2 divide-y divide-border">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex min-h-16 items-center gap-3 py-2"
            >
              <Thumbnail as="span" className="size-12 shrink-0 sm:size-10">
                <Image src={product.imageUrl} alt="" width={48} height={48} className="size-full object-contain" />
              </Thumbnail>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-b8">{product.name}</span>
                <span className="block text-body-b10 text-muted-foreground">
                  {t("unitsRemaining", { count: formatNumber(product.stockQuantity, locale) })}
                </span>
              </span>
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                aria-label={t("manageProductAria", { product: product.name })}
                className={cn(
                  focusRing,
                  "inline-flex size-11 shrink-0 items-center justify-center gap-1 rounded-input text-body-b9 text-primary transition-colors hover:bg-muted sm:h-auto sm:w-auto sm:px-2 sm:py-1.5",
                )}
              >
                <span className="sr-only sm:not-sr-only">{t("manage")}</span>
                <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-body-b8 text-muted-foreground">{t("noLowStock")}</p>
      )}
    </DashboardPanel>
  );
}
