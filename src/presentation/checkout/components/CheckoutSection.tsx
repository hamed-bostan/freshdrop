import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

interface CheckoutSectionProps {
  icon: LucideIcon;
  title: string;
  /** Optional action rendered at the end edge of the header (e.g. a link). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** A labelled checkout section: an icon + title header with optional end-side
 * action, above its content. The repeated frame for every block on the screen. */
export function CheckoutSection({ icon, title, action, children }: CheckoutSectionProps) {
  return (
    <section className="flex w-full flex-col gap-4 rounded-[18px] border border-border bg-background p-4 shadow-[0_2px_10px_rgb(15_23_42/0.025)] sm:gap-5 sm:rounded-[22px] sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Icon icon={icon} size="sm" className="text-foreground sm:hidden" />
          <Icon icon={icon} size="md" className="hidden text-foreground sm:block" />
          <h2 className="text-[17px] font-semibold leading-6 text-foreground sm:text-[20px] sm:leading-7">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
