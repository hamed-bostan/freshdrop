import { ChevronRight } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { settingCardClass, settingInteractiveClass } from "./settingRowStyles";

interface SettingRowProps {
  label: string;
  /** Render as a navigation link. */
  href?: string;
  /** Render as an action button (used when there is no `href`). */
  onClick?: () => void;
  tone?: "default" | "destructive";
}

/**
 * A chevron row that is either a navigation link (`href`) or an action button
 * (`onClick`). `tone="destructive"` colours the label and chevron (e.g. Logout).
 */
export function SettingRow({ label, href, onClick, tone = "default" }: SettingRowProps) {
  const className = cn(
    settingCardClass,
    settingInteractiveClass,
    tone === "destructive" ? "text-destructive" : "text-foreground hover:text-primary",
  );

  const content = (
    <>
      <span className="text-body-b3">{label}</span>
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
