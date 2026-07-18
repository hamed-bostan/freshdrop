import { ChevronRight } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { focusRing, Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

interface ProfileMenuItemProps {
  label: string;
  href: string;
}

export function ProfileMenuItem({ label, href }: ProfileMenuItemProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center justify-between rounded-card-md p-4 text-foreground transition-colors hover:text-primary", focusRing)}
    >
      <span className="text-body-b3">{label}</span>
      <Icon icon={ChevronRight} size="sm" className="rtl:-scale-x-100" />
    </Link>
  );
}
