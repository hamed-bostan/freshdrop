import type { LucideIcon } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

type StatCardProps = {
  /** The headline metric, already formatted for the active locale (money, count, …). */
  value: string;
  /** What the metric measures. */
  label: string;
  /** Optional secondary line under the label (e.g. the window a metric covers). */
  hint?: string;
  /** Lucide mark rendered in the card's corner, through the design-system `Icon`. */
  icon: LucideIcon;
};

/**
 * A single KPI tile for the dashboard overview: a big value, a label, an optional
 * hint, and a tinted icon badge. Hand-rolled from Falcon tokens — presentational
 * and locale-agnostic (the caller formats `value`).
 */
export function StatCard({ value, label, hint, icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card-lg border border-border p-5">
      <div className="flex size-10 items-center justify-center rounded-card-md bg-surface-sunken text-primary">
        <Icon icon={icon} size="sm" />
      </div>
      <div>
        <p className="text-heading-h2 text-foreground">{value}</p>
        <p className="text-body-b7 text-muted-foreground">{label}</p>
        {hint ? <p className="text-body-b8 text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
