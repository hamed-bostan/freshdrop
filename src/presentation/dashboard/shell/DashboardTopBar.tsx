"use client";

import { useTranslations } from "next-intl";
import { LifeBuoy, Menu } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { LocaleToggle } from "./LocaleToggle";
import { UserMenu } from "./UserMenu";
import type { DashboardViewer } from "./viewer";

type DashboardTopBarProps = {
  viewer: DashboardViewer;
  /** Opens the mobile nav drawer — only the hamburger below `lg` needs this. */
  onOpenNav: () => void;
};

/**
 * Persistent chrome above every dashboard page: the mobile nav trigger (the
 * desktop rail covers `lg` and up), a help link, the locale toggle, and the
 * account menu. No search field yet — it has nothing to query until a later
 * phase wires it, and a disabled input that goes nowhere is worse than no
 * input at all.
 */
export function DashboardTopBar({ viewer, onOpenNav }: DashboardTopBarProps) {
  const t = useTranslations("dashboard");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background px-4 py-3 lg:px-8">
      <Button variant="ghost" iconOnly size="sm" aria-label={t("openNav")} onClick={onOpenNav} className="lg:hidden">
        <Icon icon={Menu} size="sm" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" iconOnly size="sm" aria-label={t("help")} asChild>
        <a href="mailto:support@yourapp.com">
          <Icon icon={LifeBuoy} size="sm" />
        </a>
      </Button>

      <LocaleToggle />

      <UserMenu viewer={viewer} />
    </header>
  );
}
