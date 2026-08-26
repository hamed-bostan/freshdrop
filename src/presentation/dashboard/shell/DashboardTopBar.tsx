"use client";

import { CircleHelp, Leaf, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/src/i18n/navigation";
import { NotificationBell } from "@/src/presentation/dashboard/notifications/NotificationBell";
import { Button, Icon } from "@/src/presentation/design-system";

import { LocaleToggle } from "./LocaleToggle";
import { UserMenu } from "./UserMenu";

import type { DashboardViewer } from "./viewer";

type DashboardTopBarProps = {
  viewer: DashboardViewer;
  /** Opens the mobile nav drawer — only the hamburger below `lg` needs this. */
  onOpenNav: () => void;
  /** Opens the ⌘K command palette — from the field on `lg`+, the icon trigger below it. */
  onOpenSearch: () => void;
};

/**
 * Persistent chrome above every dashboard page: the mobile nav trigger (the
 * desktop rail covers `md` and up), the global search trigger, a help link,
 * the locale toggle, and the account menu.
 */
export function DashboardTopBar({ viewer, onOpenNav, onOpenSearch }: DashboardTopBarProps) {
  const t = useTranslations("dashboard");

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-2 border-b border-border bg-background px-6 md:h-24 md:px-8 xl:h-16 xl:px-6">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-heading-h2 text-foreground sm:hidden">
        <Icon icon={Leaf} size="md" className="text-primary" />
        <span>freshDrop</span>
      </Link>

      <Button variant="ghost" iconOnly size="sm" aria-label={t("openNav")} onClick={onOpenNav} className="hidden sm:inline-flex md:hidden">
        <Icon icon={Menu} size="sm" />
      </Button>

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden h-11 w-full max-w-sm items-center gap-2 rounded-card-md border border-transparent bg-input-filled px-4 text-start text-body-b2 text-input-placeholder transition-colors hover:border-border hover:bg-muted-strong md:flex md:h-14 md:max-w-lg xl:h-11 xl:max-w-sm"
      >
        <Icon icon={Search} size="sm" />
        <span className="flex-1 truncate">{t("search.adminTrigger")}</span>
        <kbd className="rounded-input border border-border bg-surface px-1.5 py-0.5 text-label-l2 text-muted-foreground">
          {t("search.shortcutHint")}
        </kbd>
      </button>

      <Button
        variant="ghost"
        iconOnly
        size="sm"
        aria-label={t("search.trigger")}
        onClick={onOpenSearch}
        className="hidden sm:inline-flex md:hidden"
      >
        <Icon icon={Search} size="sm" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" iconOnly size="sm" aria-label={t("help")} className="hidden xl:inline-flex" asChild>
        <a href="mailto:support@yourapp.com">
          <Icon icon={CircleHelp} size="sm" />
        </a>
      </Button>

      <NotificationBell />

      <div className="hidden sm:block">
        <LocaleToggle />
      </div>

      <UserMenu viewer={viewer} />
    </header>
  );
}
