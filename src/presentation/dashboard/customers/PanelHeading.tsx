import { Icon } from "@/src/presentation/design-system";

import type { LucideIcon } from "lucide-react";

/** Shared card chrome for the customer detail page's sidebar panels. */
export const PANEL_CLASS = "rounded-card-lg border border-border bg-background p-4";

export function PanelHeading({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2 text-body-b8 text-foreground"><Icon icon={icon} size="xs" />{children}</h2>;
}
