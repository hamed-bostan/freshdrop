"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Crown, Repeat2, RotateCcw, Search, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import type { CustomerSegmentId } from "@/src/domain/entities/CustomerSegmentsReport";
import type { Locale } from "@/src/i18n/routing";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { DataTable, Icon, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

type Segment = CustomerSegmentsWire["segments"][number];
type Health = "healthy" | "growing" | "attention";
const ICONS: Record<CustomerSegmentId, LucideIcon> = { high_value_loyal: Crown, repeat_buyers: UsersRound, new_customers: Sparkles, reactivated: RotateCcw, at_risk: AlertTriangle, dormant: Repeat2 };
const ICON_TONES: Record<CustomerSegmentId, string> = { high_value_loyal: "bg-accent text-primary", repeat_buyers: "bg-info text-info-foreground", new_customers: "bg-info text-info-foreground", reactivated: "bg-muted text-secondary", at_risk: "bg-error text-destructive", dormant: "bg-surface-sunken text-muted-foreground" };
const HEALTH_TONES: Record<Health, string> = { healthy: "bg-accent text-primary", growing: "bg-info text-info-foreground", attention: "bg-warning text-warning-foreground" };

export function CustomerSegmentPerformanceTable({ segments }: { segments: Segment[] }) {
  const t = useTranslations("dashCustomerSegments");
  const locale = useLocale() as Locale;
  const [query, setQuery] = React.useState("");
  const [health, setHealth] = React.useState<Health | "all">("all");
  const visible = segments.filter((segment) => t(`segment.${segment.id}`).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (health === "all" || segmentHealth(segment) === health));

  return <section className="min-w-0 rounded-card-lg border border-border bg-background p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-body-b5">{t("performance")}</h2><div className="flex gap-2"><label className="relative"><span className="sr-only">{t("search")}</span><Icon icon={Search} size="xs" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} className={cn(focusRing, "h-9 w-full rounded-input border border-border ps-9 pe-3 text-body-b10 sm:w-48")} /></label><Select size="sm" value={health} aria-label={t("status")} onChange={(event) => setHealth(event.target.value as Health | "all")} className="w-auto"><option value="all">{t("allStatuses")}</option><option value="healthy">{t("healthy")}</option><option value="growing">{t("growing")}</option><option value="attention">{t("statusAttention")}</option></Select></div></div>
    {visible.length ? <DataTable className="mt-3"><Table><TableHeader><tr><TableHead>{t("segmentLabel")}</TableHead><TableHead className="text-end">{t("customers")}</TableHead><TableHead className="text-end">{t("revenue")}</TableHead><TableHead className="text-end">{t("averageOrder")}</TableHead><TableHead className="text-end">{t("repeatRate")}</TableHead><TableHead className="text-end">{t("change")}</TableHead><TableHead className="text-end">{t("status")}</TableHead></tr></TableHeader><TableBody>{visible.map((segment) => {
      const change = segment.previousCustomers ? (segment.customers - segment.previousCustomers) / segment.previousCustomers : null;
      const status = segmentHealth(segment);
      return <TableRow key={segment.id}><TableCell><div className="flex min-w-36 items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-card-md ${ICON_TONES[segment.id]}`}><Icon icon={ICONS[segment.id]} size="xs" /></span><span className="font-medium">{t(`segment.${segment.id}`)}</span></div></TableCell><TableCell className="text-end">{formatNumber(segment.customers, locale)}</TableCell><TableCell className="text-end">{formatMoney(segment.revenue, locale)}</TableCell><TableCell className="text-end">{formatMoney(segment.orders ? segment.revenue / segment.orders : 0, locale)}</TableCell><TableCell className="text-end">{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(segment.customers ? segment.repeatCustomers / segment.customers : 0)}</TableCell><TableCell className={cn("text-end font-semibold", change !== null && change < 0 ? "text-destructive" : "text-success-foreground")}>{change === null ? "—" : new Intl.NumberFormat(locale, { style: "percent", signDisplay: "always", maximumFractionDigits: 1 }).format(change)}</TableCell><TableCell className="text-end"><span className={`rounded-card-md px-2 py-1 text-label-l1 ${HEALTH_TONES[status]}`}>{status === "attention" ? t("statusAttention") : t(status)}</span></TableCell></TableRow>;
    })}</TableBody></Table></DataTable> : <p className="py-12 text-center text-body-b8 text-muted-foreground">{t("noSegments")}</p>}
  </section>;
}

function segmentHealth(segment: Segment): Health { if (segment.id === "at_risk" || segment.id === "dormant") return "attention"; return segment.id === "new_customers" || segment.id === "reactivated" ? "growing" : "healthy"; }
