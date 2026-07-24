import type { LucideIcon } from "lucide-react";

/**
 * One row of the "needs attention" panel: a count the operator can act on,
 * and where acting on it leads.
 *
 * Deliberately a flat list rather than one entry per source (reviews, stock,
 * orders): the panel doesn't know or care what produced a count, only that
 * it names something to do — which is what lets it fold signals from
 * unrelated endpoints into one strip without any of them knowing about the
 * others.
 */
export type AttentionItem = {
  /** Stable key for the list — not shown. */
  key: string;
  /** Lucide mark shown beside the title. */
  icon: LucideIcon;
  /** Which feedback tone the count and icon take. */
  tone: "warning" | "danger";
  /** How many things this row counts. A zero-count row is dropped by the panel. */
  count: number;
  /** What the count measures, e.g. "Pending reviews". */
  title: string;
  /** A short line saying what the count means or how it was drawn. */
  detail: string;
  /** Label for the link into the filtered rows behind the count. */
  ctaLabel: string;
  /** Where the count's own rows live — the same filter the count was computed from. */
  href: string;
};
