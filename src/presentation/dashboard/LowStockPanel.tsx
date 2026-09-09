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
    <DashboardPanel className="h-full min-w-0 overflow-hidden">
      <DashboardPanelHeader
        title={t("lowStockProducts")}
        action={(
          <Link
            href="/dashboard/inventory"
            aria-label={t("viewAllInventory")}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-input px-2 text-body-b8 text-primary hover:underline sm:min-h-8"
          >
            <span>{t("viewAll")}</span>
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
                  "inline-flex h-11 w-auto shrink-0 items-center justify-center gap-1 rounded-input px-2 text-body-b10 font-semibold text-primary transition-colors hover:bg-muted sm:h-auto sm:py-1.5 sm:text-body-b9",
                )}
              >
                <span>{t("manage")}</span>
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
