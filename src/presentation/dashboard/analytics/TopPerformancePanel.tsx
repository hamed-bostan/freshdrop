"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, ShoppingBasket, Tag, type LucideIcon } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Icon, Thumbnail, focusRing } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import type { RevenueRankRow } from "./RevenueRankPanel";

const PAGE_SIZE = 5;
type RankingKind = "products" | "categories";

export function TopPerformancePanel({ products, categories }: { products: RevenueRankRow[]; categories: RevenueRankRow[] }) {
  const t = useTranslations("dashAnalytics");
  const locale = useLocale() as Locale;
  const [kind, setKind] = useState<RankingKind>("products");
  const rows = kind === "products" ? products : categories;
  const visible = rows.slice(0, PAGE_SIZE);
  const reportHref = kind === "products" ? "/dashboard/products" : "/dashboard/categories";

  return (
    <section className="flex h-full min-w-0 flex-col rounded-card-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-body-b5 text-foreground">{t("topPerformance")}</h2>
        <Link href={reportHref} className={cn(focusRing, "inline-flex items-center gap-1 rounded-card-md text-body-b10 text-primary hover:underline")}>{t("viewReport")}<Icon icon={ExternalLink} size="xs" /></Link>
      </div>

      <div className="mt-2 flex" role="tablist" aria-label={t("topPerformance")}>
        <PerformanceTab active={kind === "products"} icon={ShoppingBasket} label={t("productsTab")} onClick={() => setKind("products")} />
        <PerformanceTab active={kind === "categories"} icon={Tag} label={t("categoriesTab")} onClick={() => setKind("categories")} />
      </div>

      <div className="mt-1 min-w-0 flex-1 overflow-x-auto">
        <table className="w-full min-w-[20rem] table-fixed text-body-b10">
          <colgroup><col className="w-8" /><col /><col className="w-12" /><col className="w-20" /></colgroup>
          <thead className="bg-surface-sunken text-muted-foreground"><tr className="h-7"><th className="px-1.5 text-start">#</th><th className="px-1.5 text-start">{kind === "products" ? t("colProduct") : t("colCategory")}</th><th className="px-1.5 text-end">{t("colUnits")}</th><th className="px-1.5 text-end">{t("colRevenue")}</th></tr></thead>
          <tbody className="divide-y divide-border">
            {visible.map((row, index) => <tr key={row.id} className="h-7"><td className="px-1.5 text-muted-foreground">{formatNumber(index + 1, locale)}</td><td className="min-w-0 px-1.5"><span className="flex min-w-0 items-center gap-1.5">{row.imageUrl ? <Thumbnail className="size-6 shrink-0"><Image src={row.imageUrl} alt="" width={24} height={24} className="size-full object-contain" /></Thumbnail> : null}<span title={row.label} className="min-w-0 truncate text-foreground">{row.label}</span></span></td><td className="px-1.5 text-end text-muted-foreground">{formatNumber(row.units, locale)}</td><td className="px-1.5 text-end font-medium text-foreground">{formatMoney(row.revenue, locale)}</td></tr>)}
          </tbody>
        </table>
      </div>

      <Link href={reportHref} className={cn(focusRing, "mt-auto inline-flex items-center gap-1 pt-2 text-body-b10 font-semibold text-primary hover:underline")}>{t(kind === "products" ? "viewAllProducts" : "viewAllCategories")}<Icon icon={ExternalLink} size="xs" /></Link>
    </section>
  );
}

function PerformanceTab({ active, icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn(focusRing, "inline-flex h-7 min-w-20 items-center justify-center gap-1 rounded-input border px-3 text-body-b10 transition-colors", active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon icon={icon} size="xs" />{label}</button>;
}
