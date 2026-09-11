
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/presentation/design-system";

import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  label: string;
  tone: string;
  className?: string;
};

export function ReportStatusBadge({ icon, label, tone, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-fit items-center gap-2 whitespace-nowrap rounded-button border border-current/15 px-3 text-body-b10 font-semibold",
        tone,
        className,
      )}
    >
      {icon ? <Icon icon={icon} size="xs" /> : null}
      {label}
    </span>
  );
}
