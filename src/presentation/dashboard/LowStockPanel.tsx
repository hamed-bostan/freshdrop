import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { Product } from "@/src/domain/entities/Product";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Thumbnail } from "@/src/presentation/design-system";
import { formatNumber } from "@/src/lib/formatNumber";

interface Props { products: Product[] }

export async function LowStockPanel({ products }: Props) {
  const t = await getTranslations("dashHome");
  const locale = (await getLocale()) as Locale;
  return <section className="rounded-card-lg border border-border p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="text-body-b5 font-semibold">{t("lowStockProducts")}</h2><Link href="/dashboard/inventory" className="text-body-b8 text-primary hover:underline">{t("viewAllInventory")}</Link></div>
    {products.length ? <ul className="mt-2 divide-y divide-border">{products.map((product) => <li key={product.id} className="flex items-center gap-3 py-1.5">
      <Thumbnail as="span" className="size-9"><Image src={product.imageUrl} alt="" width={36} height={36} className="size-full object-contain" /></Thumbnail>
      <span className="min-w-0 flex-1"><span className="block truncate text-body-b7 font-medium">{product.name}</span><span className="block text-body-b9 text-error-foreground">{t("unitsRemaining", { count: formatNumber(product.stockQuantity, locale) })}</span></span>
      <Link href={`/dashboard/products/${product.id}/edit`} className="rounded-input border border-border px-3 py-1.5 text-body-b9 transition-colors hover:bg-muted">{t("manage")}</Link>
    </li>)}</ul> : <p className="py-8 text-center text-body-b8 text-muted-foreground">{t("noLowStock")}</p>}
  </section>;
}
