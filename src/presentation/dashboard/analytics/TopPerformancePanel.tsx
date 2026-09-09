import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { percentChange, type TopProduct } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, Thumbnail, focusRing } from "@/src/presentation/design-system";

export async function TopPerformancePanel({ products }: { products: TopProduct[] }) {
  const t = await getTranslations("dashAnalytics");
  const tr = await getTranslations("dashReports");
  const locale = (await getLocale());
  return <section className="flex h-full min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
    <h2 className="text-body-b5 text-foreground">{tr("topSellingProducts")}</h2>
    {products.length ? <>
      <ul className="mt-3 divide-y divide-border lg:hidden">
        {products.slice(0, 5).map((product) => <MobileProductRow key={product.productId} product={product} locale={locale} />)}
      </ul>
      <div className="mt-2 hidden min-w-0 overflow-x-auto lg:block"><table className="w-full table-fixed text-body-b10"><colgroup><col /><col className="w-24" /><col className="w-28" /><col className="w-36" /></colgroup><thead className="border-b border-border text-muted-foreground"><tr><th className="py-2 text-start font-medium">{tr("product")}</th><th className="px-2 py-2 text-end font-medium">{tr("unitsSold")}</th><th className="px-2 py-2 text-end font-medium">{tr("netSales")}</th><th className="py-2 text-end font-medium">{t("vsPreviousPeriod")}</th></tr></thead><tbody className="divide-y divide-border">{products.slice(0, 5).map((product) => <ProductRow key={product.productId} product={product} locale={locale} />)}</tbody></table></div>
    </> : <p className="flex flex-1 items-center justify-center py-8 text-body-b10 text-muted-foreground">{tr("noSales")}</p>}
    <Link href="/dashboard/reports/sales" className={cn(focusRing, "mt-auto inline-flex min-h-11 items-center gap-1 border-t border-border pt-3 text-body-b7 font-semibold text-primary hover:underline lg:min-h-8 lg:text-body-b10")}>{t("salesReport")}<Icon icon={ChevronRight} size="xs" className="rtl:rotate-180" /></Link>
  </section>;
}

function MobileProductRow({ product, locale }: { product: TopProduct; locale: Locale }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0">
      {product.imageUrl ? (
        <Thumbnail className="size-10">
          <Image src={product.imageUrl} alt="" width={40} height={40} className="size-full object-contain" />
        </Thumbnail>
      ) : <span className="size-10 shrink-0 rounded-card-md bg-surface-sunken" aria-hidden />}
      <Link href={`/dashboard/products/${product.productId}/edit`} className="inline-flex min-h-11 min-w-0 flex-1 items-center truncate text-body-b7 font-semibold text-foreground hover:underline">{product.name}</Link>
      <div className="shrink-0 text-end text-body-b10">
        <p className="text-muted-foreground">{formatNumber(product.units, locale)}</p>
        <p className="mt-1 font-semibold text-foreground">{formatMoney(product.revenue, locale)}</p>
      </div>
    </li>
  );
}

function ProductRow({ product, locale }: { product: TopProduct; locale: Locale }) {
  const change = percentChange(product.revenue, product.previousRevenue);
  return <tr className="h-9"><td className="py-1"><div className="flex min-w-0 items-center gap-2">{product.imageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={product.imageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : <span className="size-7 shrink-0 rounded-card-md bg-surface-sunken" />}<Link href={`/dashboard/products/${product.productId}/edit`} className="truncate text-foreground hover:underline">{product.name}</Link></div></td><td className="px-2 py-1 text-end">{formatNumber(product.units, locale)}</td><td className="px-2 py-1 text-end">{formatMoney(product.revenue, locale)}</td><td className="py-1 text-end">{change === null ? <span className="text-muted-foreground">—</span> : <span className={cn("inline-flex items-center gap-1 font-medium", change >= 0 ? "text-success-foreground" : "text-destructive")}><Icon icon={change >= 0 ? ArrowUp : ArrowDown} size="xs" />{formatPercent(Math.abs(change), locale)}</span>}</td></tr>;
}
