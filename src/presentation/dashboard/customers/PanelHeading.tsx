import { Icon } from "@/src/presentation/design-system";

import type { LucideIcon } from "lucide-react";

/** Shared card chrome for the customer detail page's sidebar panels. */
export const PANEL_CLASS = "min-w-0 rounded-card-lg border border-border bg-background p-5 sm:p-6";

export function PanelHeading({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2.5 text-body-b5 text-foreground"><Icon icon={icon} size="sm" className="shrink-0 text-muted-foreground" />{children}</h2>;
}
