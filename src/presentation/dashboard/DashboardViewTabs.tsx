
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";

import type { ComponentProps, ReactNode } from "react";

/** URL-driven dashboard views share one underline style and native link semantics. */
export function DashboardViewTabs({ label, children }: { label: string; children: ReactNode }) {
  return <nav aria-label={label} className="flex min-w-0 max-w-full overflow-x-auto border-b border-border">{children}</nav>;
}

export function DashboardViewTab({ active, children, className, ...props }: ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      {...props}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-5 py-2 text-body-b8 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
        className,
      )}
    >{children}</Link>
  );
}
