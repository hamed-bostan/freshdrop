import type { ReactNode } from "react";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";

type PanelRowCardProps = {
  /** Where the row leads. Omitted renders a plain, unlinked row — Customer Insights' rows have nowhere to go. */
  href?: string;
  /**
   * `"fill"` is a ranked row (Top products/categories): a flat accent
   * background, content laid out horizontally. `"outline"` is an
   * informational row (Customer Insights): a hairline border, content
   * stacked with the label on top and the value pinned to the bottom.
   */
  surface: "fill" | "outline";
  children: ReactNode;
};

/**
 * The one row shape the overview's three-panel row is built from. All three
 * cards (Top products, Top categories, Customer insights) need to land on the
 * same height, and the only way to guarantee that — rather than duplicating
 * padding/radius/height across two components and hoping they stay in sync —
 * is for every row, in every panel, to come from here. Callers only supply
 * what differs: the surface treatment, the link target, and the content.
 */
export function PanelRowCard({ href, surface, children }: PanelRowCardProps) {
  const frame = cn(
    "min-h-22 rounded-card-lg p-4",
    surface === "fill"
      ? "flex items-center gap-3 bg-accent"
      : "flex flex-col justify-between gap-1 border border-border",
  );

  return (
    <li>
      {href ? (
        <Link href={href} className={frame}>
          {children}
        </Link>
      ) : (
        <div className={frame}>{children}</div>
      )}
    </li>
  );
}
