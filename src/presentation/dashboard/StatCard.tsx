import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { focusRing, Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";

/**
 * Colour tone of the icon badge — one per KPI so each tile reads at a glance
 * (brand green for revenue, info blue for live orders, warning yellow for the
 * review queue, danger orange for low stock). Mapped onto the shared feedback
 * tokens rather than raw colours.
 */
export type StatCardTone = "brand" | "info" | "warning" | "danger";

const TONE_STYLES: Record<StatCardTone, string> = {
  brand: "bg-accent text-primary",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-error text-error-foreground",
};

type StatCardProps = {
  /** The headline metric, already formatted for the active locale (money, count, …). */
  value: string;
  /** What the metric measures — sits at the top of the tile, opposite the icon. */
  label: string;
  /** Optional secondary line under the value (e.g. the window a metric covers). */
  hint?: string;
  /** Lucide mark rendered in the card's tinted corner badge. */
  icon: LucideIcon;
  /** Which feedback tone the icon badge takes. */
  tone: StatCardTone;
  /**
   * Where the tile leads. A metric that names a problem should take you to the
   * rows behind it — "4 low on stock" is only actionable once you can see which
   * four. Omitted for a tile that has nowhere to go (a revenue total isn't a
   * filtered list of anything).
   */
  href?: string;
  /**
   * How this metric moved against the previous period, already formatted for the
   * locale (e.g. "+12%"). Omitted when there is nothing to compare — a tile that
   * counts a *current* state (open orders, the review queue) has no previous-period
   * version of itself, and inventing one would read as a trend.
   */
  delta?: string;
  /**
   * Which way the metric moved, deciding the arrow and the colour. Separate from
   * the formatted `delta` because the sign alone doesn't say whether the move was
   * good: a rise in revenue is green and a rise in cancellations is not, so the
   * caller states the direction it means rather than the tile inferring it from a
   * leading "+".
   */
  deltaTone?: "up" | "down" | "flat";
  /** What the delta is measured against, e.g. "vs previous 30 days". Replaces `hint` when present. */
  deltaLabel?: string;
};

/**
 * Arrow, text colour and pill tint per direction. `flat` is deliberately muted
 * and gets a dash rather than an arrow: "no change" is information, and drawing
 * it in a trend colour makes a still metric look like a moving one.
 */
const DELTA_STYLES: Record<"up" | "down" | "flat", { icon: LucideIcon; className: string; badgeClassName: string }> = {
  up: { icon: TrendingUp, className: "text-success-foreground", badgeClassName: "bg-success text-success-foreground" },
  down: { icon: TrendingDown, className: "text-error-foreground", badgeClassName: "bg-error text-error-foreground" },
  flat: { icon: Minus, className: "text-muted-foreground", badgeClassName: "bg-muted text-muted-foreground" },
};

/**
 * A single KPI tile for the dashboard overview: the label and a tinted icon badge
 * on top, the big value and an optional hint pinned to the bottom. Hand-rolled from
 * Falcon tokens — presentational and locale-agnostic (the caller formats `value`).
 *
 * With an `href` the whole tile becomes the link, rather than growing a "view all"
 * affordance in a corner: the tile is already the thing you'd click, and a small
 * target inside a large clickable-looking card is the worse of the two.
 */
export function StatCard({
  value,
  label,
  hint,
  icon,
  tone,
  href,
  delta,
  deltaTone = "flat",
  deltaLabel,
}: StatCardProps) {
  const trend = DELTA_STYLES[deltaTone];

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-body-b7 text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            TONE_STYLES[tone],
          )}
        >
          <Icon icon={icon} size="sm" />
        </div>
      </div>
      <div>
        <p className="text-heading-h2 text-foreground">{value}</p>
        {delta ? (
          // The change lives in its own tinted pill so the direction reads at a
          // glance; what it's measured against sits beside it in plain muted
          // text — a "+12%" with no stated baseline is the most common way a
          // dashboard misleads, because every reader supplies a different one.
          <p className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-body-b11",
                trend.badgeClassName,
              )}
            >
              <Icon icon={trend.icon} size="xs" />
              {delta}
            </span>
            {deltaLabel ? <span className="text-body-b8 text-muted-foreground">{deltaLabel}</span> : null}
          </p>
        ) : hint ? (
          <p className="mt-2 text-body-b8 text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </>
  );

  const frame = "flex h-full flex-col justify-between gap-6 rounded-card-lg border border-border p-5";

  if (href) {
    return (
      <Link href={href} className={cn(frame, focusRing, "transition-colors hover:bg-muted")}>
        {content}
      </Link>
    );
  }

  return <div className={frame}>{content}</div>;
}
