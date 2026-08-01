import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ExternalLink, Info } from "lucide-react";
import type { TopProduct } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { DataTable, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Thumbnail, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export async function TopSellingProductsTable({ products, totalRevenue, locale }: { products: TopProduct[]; totalRevenue: number; locale: Locale }) {
  const t = await getTranslations("dashReports");
  return (
    <section className="flex min-h-64 min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
      <h2 className="flex items-center gap-1.5 text-body-b5 text-foreground">{t("topSellingProducts")}<Icon icon={Info} size="xs" className="text-muted-foreground" /></h2>
      {products.length ? <DataTable className="mt-2"><Table><TableHeader><tr><TableHead>{t("product")}</TableHead><TableHead className="text-end">{t("unitsSold")}</TableHead><TableHead className="text-end">{t("netSales")}</TableHead><TableHead className="text-end">{t("revenueShare")}</TableHead></tr></TableHeader><TableBody>{products.map((product) => <TableRow key={product.productId}><TableCell><div className="flex min-w-44 items-center gap-3">{product.imageUrl ? <Thumbnail className="size-8 shrink-0"><Image src={product.imageUrl} alt="" width={32} height={32} className="size-full object-contain" /></Thumbnail> : <span className="size-8 rounded-card-md bg-surface-sunken" aria-hidden />}<Link href={`/dashboard/products/${product.productId}/edit`} className="truncate text-body-b7 text-foreground hover:underline">{product.name}</Link></div></TableCell><TableCell className="text-end text-body-b7">{formatNumber(product.units, locale)}</TableCell><TableCell className="text-end text-body-b7">{formatMoney(product.revenue, locale)}</TableCell><TableCell className="text-end text-body-b7 text-success-foreground">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(totalRevenue > 0 ? product.revenue / totalRevenue * 100 : 0)}%</TableCell></TableRow>)}</TableBody></Table></DataTable> : <p className="flex flex-1 items-center justify-center text-body-b7 text-muted-foreground">{t("noSales")}</p>}
      <Link href="/dashboard/analytics?productSort=revenue" className={cn(focusRing, "mt-auto flex items-center gap-1 border-t border-border pt-3 text-body-b8 text-primary hover:text-primary-hover")}>{t("viewAllProducts")}<Icon icon={ExternalLink} size="xs" /></Link>
    </section>
  );
}
