import { Lightbulb } from "lucide-react";

import { Link } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  actionLabel: string;
  emphasize?: boolean;
};

export function CustomerReportInsightBanner({ children, actionLabel, emphasize = false }: Props) {
  return (
    <aside className="flex flex-col gap-4 rounded-card-lg border border-destructive/30 bg-error/40 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
      <div className="flex items-start gap-4 sm:items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-destructive/25 bg-background text-primary">
          <Icon icon={Lightbulb} size="sm" />
        </span>
        <p className={emphasize ? "text-body-b7 font-semibold" : "text-body-b7"}>{children}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="w-full shrink-0 border-primary/60 bg-background px-5 text-body-b10 sm:w-auto">
        <Link href="/dashboard/customers">{actionLabel}</Link>
      </Button>
    </aside>
  );
}
