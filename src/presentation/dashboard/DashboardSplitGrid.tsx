import type { ReactNode } from "react";

type DashboardSplitGridProps = {
  primary: ReactNode;
  secondary: ReactNode;
};

/**
 * The overview's reusable two-panel composition.
 *
 * A 12-column grid expresses the information hierarchy without coupling it to
 * a particular pixel width or hand-tuned fractional track. The container query
 * responds to the workspace that remains after the sidebar, so the panels stack
 * whenever their actual content area is too narrow, regardless of viewport size.
 */
export function DashboardSplitGrid({ primary, secondary }: DashboardSplitGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @5xl:grid-cols-12">
      <div className="grid min-w-0 @5xl:col-span-8">{primary}</div>
      <div className="grid min-w-0 @5xl:col-span-4">{secondary}</div>
    </div>
  );
}
