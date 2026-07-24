"use client";

import { useTranslations } from "next-intl";
import { Leaf } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

type SidebarBrandProps = {
  /** Icon-only mark for the collapsed rail — the wordmark has nowhere to go at 40px. */
  collapsed?: boolean;
};

/** The dashboard's brand link, shared by the desktop rail, the collapsed rail, and the mobile drawer. */
export function SidebarBrand({ collapsed = false }: SidebarBrandProps) {
  const t = useTranslations("dashboard");

  return (
    <Link
      href="/dashboard"
      title={collapsed ? `FreshDrop ${t("admin")}` : undefined}
      className={cn(
        "flex items-center gap-2 py-5 text-heading-h3 text-foreground",
        focusRing,
        collapsed ? "justify-center px-0" : "px-5",
      )}
    >
      <Icon icon={Leaf} size="md" className="text-primary" />
      <span className={cn(collapsed && "sr-only")}>
        FreshDrop <span className="text-primary">{t("admin")}</span>
      </span>
    </Link>
  );
}
