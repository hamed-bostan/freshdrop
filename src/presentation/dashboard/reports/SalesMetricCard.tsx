import { ArrowDown, ArrowUp, Info, type LucideIcon } from "lucide-react";

import type { Locale } from "@/src/i18n/routing";
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/presentation/design-system";

import { StatSparkline } from "../StatSparkline";

type SalesMetricCardProps = {
  label: string; value: string; icon: LucideIcon; tone: "green" | "blue" | "orange" | "purple" | "red";
  delta: number | null; values: number[]; locale: Locale; comparisonLabel: string; currentLabel: string; inverse?: boolean;
  className?: string;
};

const TONES = {
  green: { icon: "bg-accent text-primary", chart: "var(--color-primary)" },
  blue: { icon: "bg-info text-info-foreground", chart: "var(--color-chart-2)" },
  orange: { icon: "bg-error text-destructive", chart: "var(--color-chart-5)" },
  purple: { icon: "bg-muted text-secondary", chart: "var(--color-secondary)" },
  red: { icon: "bg-error text-destructive", chart: "var(--color-destructive)" },
};

export function SalesMetricCard({ label, value, icon, tone, delta, values, locale, comparisonLabel, currentLabel, inverse = false, className }: SalesMetricCardProps) {
  const change = delta === null ? null : delta * 100;
  const favorable = change !== null && (inverse ? change <= 0 : change >= 0);
  return (
    <article className={cn("flex min-h-36 min-w-0 flex-col overflow-hidden rounded-card-lg border border-border bg-background p-4 pb-2", className)}>
      <div className="flex items-start gap-3">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${TONES[tone].icon}`}><Icon icon={icon} size="sm" /></span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-body-b10 text-muted-foreground"><span className="truncate">{label}</span><Icon icon={Info} size="xs" /></p>
          <p className="mt-0.5 truncate text-heading-h3 text-foreground">{value}</p>
          <p className="mt-1 flex items-center gap-1 text-body-b10">
            {change === null ? <span className="text-muted-foreground">{currentLabel}</span> : <><Icon icon={favorable ? ArrowUp : ArrowDown} size="xs" className={favorable ? "text-success-foreground" : "text-destructive"} /><span className={favorable ? "font-semibold text-success-foreground" : "font-semibold text-destructive"}>{new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: "always" }).format(change)}%</span><span className="truncate text-muted-foreground">{comparisonLabel}</span></>}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-2"><StatSparkline values={values} positive={favorable} color={TONES[tone].chart} heightClassName="h-8" /></div>
    </article>
  );
}
