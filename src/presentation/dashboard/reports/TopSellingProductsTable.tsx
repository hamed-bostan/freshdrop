import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { percentChange, type TopProduct } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Thumbnail, focusRing } from "@/src/presentation/design-system";

export async function TopSellingProductsTable({ products, locale }: { products: TopProduct[]; totalRevenue: number; locale: Locale }) {
  const t = await getTranslations("dashReports");
  const ta = await getTranslations("dashAnalytics");
  return <section className="flex min-h-64 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
    <h2 className="text-body-b5 text-foreground">{t("topSellingProducts")}</h2>
    {products.length ? <>
      <ul className="mt-3 divide-y divide-border md:hidden">
        {products.slice(0, 5).map((product) => <MobileProductRow key={product.productId} product={product} locale={locale} salesMeta={t("productSalesMeta", { units: formatNumber(product.units, locale), orders: formatNumber(product.orders, locale) })} />)}
      </ul>
      <DataTable className="mt-2 hidden rounded-none border-0 md:block"><Table className="table-fixed text-body-b10"><colgroup><col /><col className="w-20" /><col className="w-24" /><col className="w-20" /><col className="w-28" /></colgroup><TableHeader className="border-b border-border bg-transparent text-body-b10"><tr><TableHead className="px-0 py-2 text-start">{t("product")}</TableHead><TableHead className="px-2 py-2 text-end">{t("unitsSold")}</TableHead><TableHead className="px-2 py-2 text-end">{t("netSales")}</TableHead><TableHead className="px-2 py-2 text-end">{ta("kpiOrders")}</TableHead><TableHead className="px-0 py-2 text-end">{ta("vsPreviousPeriod")}</TableHead></tr></TableHeader><TableBody>{products.slice(0, 5).map((product) => <ProductRow key={product.productId} product={product} locale={locale} />)}</TableBody></Table></DataTable>
      <Link href="/dashboard/products" className={cn(focusRing, "mt-auto inline-flex items-center gap-1 border-t border-border pt-3 text-body-b10 font-semibold text-primary hover:underline")}>{ta("viewAllProducts")}<Icon icon={ChevronRight} size="xs" className="rtl:rotate-180" /></Link>
    </> : <p className="flex flex-1 items-center justify-center text-body-b7 text-muted-foreground">{t("noSales")}</p>}
  </section>;
}

function MobileProductRow({ product, locale, salesMeta }: { product: TopProduct; locale: Locale; salesMeta: string }) {
  const change = percentChange(product.revenue, product.previousRevenue);
  return <li>
    <Link href={`/dashboard/products/${product.productId}/edit`} className={cn(focusRing, "flex min-w-0 items-center gap-2 rounded-card-md py-3 hover:bg-surface-sunken/50")}>
      {product.imageUrl ? <Thumbnail className="size-9 shrink-0"><Image src={product.imageUrl} alt="" width={36} height={36} className="size-full object-contain" /></Thumbnail> : <span className="size-9 shrink-0 rounded-card-md bg-surface-sunken" aria-hidden />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-b10 font-semibold text-foreground">{product.name}</span>
        <span className="mt-0.5 block truncate text-label-l1 text-muted-foreground">{salesMeta}</span>
      </span>
      <span className="shrink-0 text-end text-body-b10">
        <span className="block font-semibold text-foreground">{formatMoney(product.revenue, locale)}</span>
        <span className={cn("mt-0.5 flex items-center justify-end gap-1 font-medium", change === null ? "text-muted-foreground" : change >= 0 ? "text-success-foreground" : "text-destructive")}>{change === null ? "—" : <><Icon icon={change >= 0 ? ArrowUp : ArrowDown} size="xs" />{formatPercent(Math.abs(change), locale)}</>}</span>
      </span>
      <Icon icon={ChevronRight} size="xs" className="shrink-0 text-muted-foreground rtl:rotate-180" />
    </Link>
  </li>;
}

function ProductRow({ product, locale }: { product: TopProduct; locale: Locale }) {
  const change = percentChange(product.revenue, product.previousRevenue);
  const percent = change === null ? null : change * 100;
  return <TableRow className="h-10"><TableCell className="px-0 py-1.5"><div className="flex min-w-0 items-center gap-2">{product.imageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={product.imageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : <span className="size-7 shrink-0 rounded-card-md bg-surface-sunken" aria-hidden />}<Link href={`/dashboard/products/${product.productId}/edit`} className="truncate text-body-b10 text-foreground hover:underline">{product.name}</Link></div></TableCell><TableCell className="px-2 py-1.5 text-end">{formatNumber(product.units, locale)}</TableCell><TableCell className="px-2 py-1.5 text-end">{formatMoney(product.revenue, locale)}</TableCell><TableCell className="px-2 py-1.5 text-end">{formatNumber(product.orders, locale)}</TableCell><TableCell className="px-0 py-1.5 text-end">{percent === null ? <span className="text-muted-foreground">—</span> : <span className={cn("inline-flex items-center justify-end gap-1 font-medium", percent >= 0 ? "text-success-foreground" : "text-destructive")}><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" />{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(percent))}%</span>}</TableCell></TableRow>;
}
