import { ChevronRight } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";

interface ProfileMenuItemProps {
  label: string;
  href: string;
}

export function ProfileMenuItem({ label, href }: ProfileMenuItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-card-md p-4 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-body-b3">{label}</span>
      <Icon icon={ChevronRight} size="sm" />
    </Link>
  );
}
