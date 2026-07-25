import type { LucideIcon } from "lucide-react";
import { ArrowRight, Minus, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
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
  /** Where the footer's "view all" link leads — the full Customers page. */
  viewAllHref: string;
  viewAllLabel: string;
};

const DELTA_ICON: Record<"up" | "down" | "flat", LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const DELTA_TEXT: Record<"up" | "down" | "flat", string> = {
  up: "text-success-foreground",
  down: "text-error-foreground",
  flat: "text-muted-foreground",
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
export function CustomerInsightsPanel({
  heading,
  metrics,
  viewAllHref,
  viewAllLabel,
}: CustomerInsightsPanelProps) {
  return (
    <section className="flex h-full flex-col rounded-card-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{heading}</h2>
        <Icon icon={Users} size="sm" className="text-muted-foreground" />
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-3">
        {metrics.map((metric) => (
          <li key={metric.key} className="flex flex-col gap-1 rounded-card-lg border border-border p-4">
            <span className="text-body-b8 text-muted-foreground">{metric.label}</span>
            <span className="flex items-center justify-between gap-3">
              <span className="text-heading-h2 text-foreground">{metric.value}</span>
              {metric.delta ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-body-b7",
                    DELTA_TEXT[metric.deltaTone ?? "flat"],
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

      <div className="mt-4 border-t border-border pt-3">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-body-b8 text-primary hover:underline"
        >
          {viewAllLabel}
          <Icon icon={ArrowRight} size="xs" className="rtl:-scale-x-100" />
        </Link>
      </div>
    </section>
  );
}
