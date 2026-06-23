import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

interface CheckoutSectionProps {
  icon: LucideIcon;
  title: string;
  /** Optional action rendered at the right edge of the header (e.g. a link). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** A labelled checkout section: an icon + title header with optional right-side
 * action, above its content. The repeated frame for every block on the screen. */
export function CheckoutSection({ icon, title, action, children }: CheckoutSectionProps) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Icon icon={icon} size="sm" className="text-foreground" />
          <h2 className="text-body-b7 text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
