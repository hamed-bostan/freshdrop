import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export type CustomerInsightMetric = {
  key: string;
  label: string;
  /** Already formatted for the active locale — a count or a "42%" share. */
  value: string;
  /** Already formatted, e.g. "+12%". Omitted when there's no previous-period baseline to compare against. */
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
};

type CustomerInsightsPanelProps = {
  heading: string;
  metrics: CustomerInsightMetric[];
  /** What every metric's delta is measured against, shown once rather than repeated per row. */
  comparisonLabel: string;
};

const DELTA_ICON: Record<"up" | "down" | "flat", LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const DELTA_BADGE: Record<"up" | "down" | "flat", string> = {
  up: "bg-success text-success-foreground",
  down: "bg-error text-error-foreground",
  flat: "bg-muted text-muted-foreground",
};

/**
 * Who bought this period, in three numbers: how many were new, how many had
 * already bought before, and what share of everyone who ordered has bought more
 * than once across their whole history — a different question from "returning",
 * since a customer can place two orders inside one wide period and count as a
 * repeat buyer despite being brand new to the store (see
 * `IAnalyticsRepository.customerSegments`).
 *
 * Presentational, the same division of labour as its neighbours in this row:
 * the screen resolves the figures, formats them and computes the deltas; this
 * only lays out what it's handed.
 */
export function CustomerInsightsPanel({ heading, metrics, comparisonLabel }: CustomerInsightsPanelProps) {
  return (
    <section className="flex h-full flex-col rounded-card-lg border border-border p-4">
      <h2 className="text-body-b5 text-foreground">{heading}</h2>

      <ul className="mt-4 flex flex-1 flex-col justify-center gap-4">
        {metrics.map((metric) => (
          <li key={metric.key} className="flex items-center justify-between gap-3">
            <span className="text-body-b7 text-muted-foreground">{metric.label}</span>
            <span className="flex items-center gap-2">
              <span className="text-body-b5 text-foreground">{metric.value}</span>
              {metric.delta ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-body-b11",
                    DELTA_BADGE[metric.deltaTone ?? "flat"],
                  )}
                >
                  <Icon icon={DELTA_ICON[metric.deltaTone ?? "flat"]} size="xs" />
                  {metric.delta}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-border pt-3 text-body-b8 text-muted-foreground">{comparisonLabel}</p>
    </section>
  );
}
