import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { percentChange, type TopProduct } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, Thumbnail, focusRing } from "@/src/presentation/design-system";

export async function TopPerformancePanel({ products }: { products: TopProduct[] }) {
  const t = await getTranslations("dashAnalytics");
  const tr = await getTranslations("dashReports");
  const locale = (await getLocale()) as Locale;
  return <section className="flex h-full min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
    <h2 className="text-body-b5 text-foreground">{tr("topSellingProducts")}</h2>
    {products.length ? <div className="mt-2 min-w-0 overflow-x-auto"><table className="w-full min-w-[34rem] table-fixed text-body-b10"><colgroup><col /><col className="w-24" /><col className="w-28" /><col className="w-36" /></colgroup><thead className="border-b border-border text-muted-foreground"><tr><th className="py-2 text-start font-medium">{tr("product")}</th><th className="px-2 py-2 text-end font-medium">{tr("unitsSold")}</th><th className="px-2 py-2 text-end font-medium">{tr("netSales")}</th><th className="py-2 text-end font-medium">{t("vsPreviousPeriod")}</th></tr></thead><tbody className="divide-y divide-border">{products.slice(0, 5).map((product) => <ProductRow key={product.productId} product={product} locale={locale} />)}</tbody></table></div> : <p className="flex flex-1 items-center justify-center text-body-b10 text-muted-foreground">{tr("noSales")}</p>}
    <Link href="/dashboard/reports/sales" className={cn(focusRing, "mt-auto inline-flex items-center gap-1 border-t border-border pt-3 text-body-b10 font-semibold text-primary hover:underline")}>{t("salesReport")}<Icon icon={ChevronRight} size="xs" className="rtl:rotate-180" /></Link>
  </section>;
}

function ProductRow({ product, locale }: { product: TopProduct; locale: Locale }) {
  const change = percentChange(product.revenue, product.previousRevenue);
  const percent = change === null ? null : change * 100;
  return <tr className="h-9"><td className="py-1"><div className="flex min-w-0 items-center gap-2">{product.imageUrl ? <Thumbnail className="size-7 shrink-0"><Image src={product.imageUrl} alt="" width={28} height={28} className="size-full object-contain" /></Thumbnail> : <span className="size-7 shrink-0 rounded-card-md bg-surface-sunken" />}<Link href={`/dashboard/products/${product.productId}/edit`} className="truncate text-foreground hover:underline">{product.name}</Link></div></td><td className="px-2 py-1 text-end">{formatNumber(product.units, locale)}</td><td className="px-2 py-1 text-end">{formatMoney(product.revenue, locale)}</td><td className="py-1 text-end">{percent === null ? <span className="text-muted-foreground">—</span> : <span className={cn("inline-flex items-center gap-1 font-medium", percent >= 0 ? "text-success-foreground" : "text-destructive")}><Icon icon={percent >= 0 ? ArrowUp : ArrowDown} size="xs" />{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(percent))}%</span>}</td></tr>;
}
