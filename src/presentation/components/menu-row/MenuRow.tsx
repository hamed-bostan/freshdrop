import { ChevronRight } from "lucide-react";

import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/presentation/design-system";

import { rowCardClass, rowInteractiveClass } from "./rowStyles";

import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

interface MenuRowProps {
  icon: ComponentType<LucideProps>;
  label: string;
  /** Secondary line shown under the label, e.g. "Saved products". */
  subtitle?: string;
  /** Current value shown before the chevron, e.g. "English", "On". */
  value?: string;
  /** Render as a navigation link. */
  href?: string;
  /** Render as an action button (used when there is no `href`). */
  onClick?: () => void;
  tone?: "default" | "destructive";
}

/**
 * A leading-icon row with a label (+ optional subtitle) and a trailing chevron,
 * either a navigation link (`href`) or an action button (`onClick`).
 * `tone="destructive"` colours the icon, label and chevron (e.g. Log out).
 */
export function MenuRow({ icon, label, subtitle, value, href, onClick, tone = "default" }: MenuRowProps) {
  const className = cn(
    rowCardClass,
    rowInteractiveClass,
    tone === "destructive" ? "text-destructive" : "text-foreground hover:text-primary",
  );

  const content = (
    <>
      <Icon icon={icon} size="sm" className={tone === "destructive" ? "text-destructive" : "text-primary"} />
      <span className="flex flex-1 flex-col text-start">
        <span className="text-body-b3">{label}</span>
        {subtitle && <span className="text-body-b7 text-muted-foreground">{subtitle}</span>}
      </span>
      {value && <span className="text-body-b5 text-muted-foreground">{value}</span>}
      <Icon icon={ChevronRight} size="sm" className="rtl:-scale-x-100" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(className, "text-start")}>
      {content}
    </button>
  );
}
