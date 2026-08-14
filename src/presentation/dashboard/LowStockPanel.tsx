import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import type { Product } from "@/src/domain/entities/Product";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { focusRing, Icon, Thumbnail } from "@/src/presentation/design-system";

type Props = {
  products: Product[];
};

export async function LowStockPanel({ products }: Props) {
  const t = await getTranslations("dashHome");
  const locale = (await getLocale());
  return (
    <section className="rounded-card-lg border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-b1">{t("lowStockProducts")}</h2>
        <Link href="/dashboard/inventory" className="inline-flex items-center gap-1 text-body-b8 text-primary hover:underline">
          <span className="sm:hidden">{t("viewAll")}</span>
          <span className="hidden sm:inline">{t("viewAllInventory")}</span>
          <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
        </Link>
      </div>
      {products.length ? (
        <ul className="mt-2 divide-y divide-border">
          {products.map((product, index) => (
            <li
              key={product.id}
              className={cn(
                "grid min-h-[5.125rem] grid-cols-[3.25rem_minmax(0,1fr)_2.75rem] items-center gap-3.5 py-2.5 md:min-h-[3.625rem] md:grid-cols-[2.625rem_minmax(0,1fr)_auto] md:gap-3 md:py-0",
                index > 1 && "hidden sm:grid",
              )}
            >
              <Thumbnail as="span" className="size-12 md:size-[2.625rem]">
                <Image src={product.imageUrl} alt="" width={48} height={48} className="size-full object-contain" />
              </Thumbnail>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-b8 md:text-[13px] md:leading-5">{product.name}</span>
                <span className="block text-body-b10 text-muted-foreground">
                  {t("unitsRemaining", { count: formatNumber(product.stockQuantity, locale) })}
                </span>
              </span>
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                aria-label={t("manageProductAria", { product: product.name })}
                className={cn(
                  focusRing,
                  "inline-flex size-11 shrink-0 items-center justify-center gap-1 justify-self-end rounded-input text-body-b9 text-primary transition-colors hover:bg-muted md:h-auto md:w-auto md:px-2 md:py-1.5",
                )}
              >
                <span className="sr-only md:not-sr-only">{t("manage")}</span>
                <Icon icon={ChevronRight} size="xs" className="rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-body-b8 text-muted-foreground">{t("noLowStock")}</p>
      )}
    </section>
  );
}
