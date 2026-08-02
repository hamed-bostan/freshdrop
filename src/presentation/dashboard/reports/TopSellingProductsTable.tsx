import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowDown, ArrowUp, ExternalLink, Info } from "lucide-react";
import { percentChange, type TopProduct } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Thumbnail, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export async function TopSellingProductsTable({ products, locale }: { products: TopProduct[]; totalRevenue: number; locale: Locale }) {
  const t = await getTranslations("dashReports");
  const ta = await getTranslations("dashAnalytics");
  return <section className="flex min-h-64 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
    <h2 className="flex items-center gap-1.5 text-body-b5 text-foreground">{t("topSellingProducts")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>
    {products.length ? <DataTable className="mt-2 rounded-none border-0" minWidthClassName="min-w-[44rem]"><Table className="table-fixed text-body-b10"><colgroup><col /><col className="w-24" /><col className="w-28" /><col className="w-24" /><col className="w-36" /></colgroup><TableHeader className="border-b border-border bg-transparent text-body-b10"><tr><TableHead className="px-0 py-2 text-start">{t("product")}</TableHead><TableHead className="px-2 py-2 text-end">{t("unitsSold")}</TableHead><TableHead className="px-2 py-2 text-end">{t("netSales")}</TableHead><TableHead className="px-2 py-2 text-end">{ta("kpiOrders")}</TableHead><TableHead className="px-0 py-2 text-end">{ta("vsPreviousPeriod")}</TableHead></tr></TableHeader><TableBody>{products.map((product) => <ProductRow key={product.productId} product={product} locale={locale} />)}</TableBody></Table></DataTable> : <p className="flex flex-1 items-center justify-center text-body-b7 text-muted-foreground">{t("noSales")}</p>}
    <Link href="/dashboard/analytics?productSort=revenue" className={cn(focusRing, "mt-auto flex items-center gap-1 border-t border-border pt-3 text-body-b10 font-medium text-primary hover:text-primary-hover")}>{t("viewAllProducts")}<Icon icon={ExternalLink} size="xs" /></Link>
  </section>;
}

function ProductRow({ product, locale }: { product: TopProduct; locale: Locale }) {
  const change = percentChange(product.revenue, product.previousRevenue);
  const percent = change === null ? null : change * 100;
  return <TableRow className="h-10"><TableCell className="px-0 py-1.5"><div className="flex min-w-0 items-center gap-2">{product.imageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={product.imageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : <span className="size-7 shrink-0 rounded-card-md bg-surface-sunken" aria-hidden />}<Link href={`/dashboard/products/${product.productId}/edit`} className="truncate text-body-b10 text-foreground hover:underline">{product.name}</Link></div></TableCell><TableCell className="px-2 py-1.5 text-end">{formatNumber(product.units, locale)}</TableCell><TableCell className="px-2 py-1.5 text-end">{formatMoney(product.revenue, locale)}</TableCell><TableCell className="px-2 py-1.5 text-end">{formatNumber(product.orders, locale)}</TableCell><TableCell className="px-0 py-1.5 text-end">{percent === null ? <span className="text-muted-foreground">—</span> : <span className={cn("inline-flex items-center justify-end gap-1 font-medium", percent >= 0 ? "text-success-foreground" : "text-destructive")}><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" />{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(percent))}%</span>}</TableCell></TableRow>;
}
