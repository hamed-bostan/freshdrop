"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBasket, Tag, type LucideIcon } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { Button, Icon, Thumbnail, focusRing } from "@/src/presentation/design-system";
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
  const [pages, setPages] = useState<Record<RankingKind, number>>({ products: 1, categories: 1 });
  const rows = kind === "products" ? products : categories;
  const page = pages[kind];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reportHref = kind === "products" ? "/dashboard/products" : "/dashboard/categories";

  function setPage(next: number): void {
    setPages((current) => ({ ...current, [kind]: next }));
  }

  return (
    <section className="flex h-full flex-col rounded-card-lg border border-border bg-background p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-heading-h3 text-foreground">{t("topPerformance")}</h2>
        <Link href={reportHref} className={cn(focusRing, "inline-flex items-center gap-2 rounded-card-md text-body-b7 text-primary hover:underline")}>{t("viewReport")}<Icon icon={ExternalLink} size="xs" /></Link>
      </div>

      <div className="mt-5 flex border-b border-border" role="tablist" aria-label={t("topPerformance")}>
        <PerformanceTab active={kind === "products"} icon={ShoppingBasket} label={t("productsTab")} onClick={() => setKind("products")} />
        <PerformanceTab active={kind === "categories"} icon={Tag} label={t("categoriesTab")} onClick={() => setKind("categories")} />
      </div>

      <div className="mt-4 min-w-0 flex-1 overflow-x-auto">
        <table className="w-full min-w-[34rem] table-fixed text-body-b7">
          <colgroup><col className="w-12" /><col /><col className="w-24" /><col className="w-28" /></colgroup>
          <thead className="bg-surface-sunken text-muted-foreground"><tr className="h-12"><th className="px-3 text-start">#</th><th className="px-3 text-start">{kind === "products" ? t("colProduct") : t("colCategory")}</th><th className="px-3 text-end">{t("colUnits")}</th><th className="px-3 text-end">{t("colRevenue")}</th></tr></thead>
          <tbody className="divide-y divide-border">
            {visible.map((row, index) => <tr key={row.id} className="h-14"><td className="px-3 text-muted-foreground">{formatNumber((page - 1) * PAGE_SIZE + index + 1, locale)}</td><td className="min-w-0 px-3"><span className="flex min-w-0 items-center gap-3">{row.imageUrl ? <Thumbnail className="size-10 shrink-0"><Image src={row.imageUrl} alt="" width={40} height={40} className="size-full object-contain" /></Thumbnail> : null}<span title={row.label} className="min-w-0 truncate text-foreground">{row.label}</span></span></td><td className="px-3 text-end text-muted-foreground">{formatNumber(row.units, locale)}</td><td className="px-3 text-end font-medium text-foreground">{formatMoney(row.revenue, locale)}</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
        <p className="text-body-b7 text-muted-foreground">{t(kind === "products" ? "showingTopProducts" : "showingTopCategories", { shown: Math.min(PAGE_SIZE, rows.length), total: rows.length })}</p>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" iconOnly aria-label={t("previousPage")} disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon icon={ChevronLeft} size="sm" className="rtl:rotate-180" /></Button><Button variant="ghost" size="sm" iconOnly aria-label={t("nextPage")} disabled={page >= pageCount} onClick={() => setPage(page + 1)}><Icon icon={ChevronRight} size="sm" className="rtl:rotate-180" /></Button></div>
      </div>
    </section>
  );
}

function PerformanceTab({ active, icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn(focusRing, "inline-flex min-w-44 items-center justify-center gap-2 border border-b-0 border-border px-5 py-3 text-body-b3 transition-colors first:rounded-ss-card-md last:rounded-se-card-md", active ? "border-b-2 border-b-primary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon icon={icon} size="sm" />{label}</button>;
}
