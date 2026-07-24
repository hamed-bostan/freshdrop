"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Dialog, VisuallyHidden } from "radix-ui";
import { ClipboardList, Clock, Command, Package, PercentCircle, Search, Tag, Users, type LucideIcon } from "lucide-react";
import type { AdminSearchGroupType } from "@/src/domain/entities/AdminSearchResults";
import type { Permission } from "@/src/domain/entities/Permission";
import { useRouter } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { Icon, Spinner } from "@/src/presentation/design-system";
import { loadRecentSearches, pushRecentSearch, type RecentSearch } from "./recentSearches";
import { staticCommandsFor, type StaticCommand } from "./staticCommands";
import { useAdminSearch } from "./useAdminSearch";

const GROUP_ICONS: Record<AdminSearchGroupType, LucideIcon> = {
  orders: ClipboardList,
  products: Package,
  customers: Users,
  categories: Tag,
  promoCodes: PercentCircle,
};

type Row = {
  key: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onSelect: () => void;
};

type Section = {
  key: string;
  label: string;
  rows: Row[];
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gates which static commands are offered — mirrors the nav's own gating. */
  permissions: readonly Permission[];
  /** Keys the per-user recent-searches list in localStorage. */
  viewerId: string;
};

/**
 * The dashboard's ⌘K / Ctrl+K global search — a Radix Dialog (focus trap + Esc
 * + outside-click + focus restore all come free from Radix) holding one input
 * and a keyboard-navigable, flat list of rows: static commands, recent picks
 * (empty query), and live search hits (non-empty query, debounced against
 * `GET /api/admin/search`).
 *
 * Mounted once in `DashboardShell` so the shortcut works from anywhere in the
 * dashboard, not just while a search field happens to be focused.
 */
export function CommandPalette({ open, onOpenChange, permissions, viewerId }: CommandPaletteProps) {
  const t = useTranslations("dashboard.search");
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [recents, setRecents] = React.useState<RecentSearch[]>([]);

  React.useEffect(() => {
    if (open) setRecents(loadRecentSearches(viewerId));
    else setQuery("");
  }, [open, viewerId]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Global shortcut — works from anywhere in the dashboard, not just a focused field.
  React.useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [open, onOpenChange]);

  const commands = React.useMemo(() => staticCommandsFor(permissions), [permissions]);
  const { response, isLoading, isError } = useAdminSearch(query);

  const trimmedQuery = query.trim();

  function runHit(hit: { id: string; type: AdminSearchGroupType; title: string; subtitle: string; href: string }): void {
    pushRecentSearch(viewerId, hit);
    onOpenChange(false);
    router.push(hit.href);
  }

  function runCommand(command: StaticCommand): void {
    onOpenChange(false);
    router.push(command.href);
  }

  const filteredCommands = commands
    .map((command) => ({ command, label: t(`commandLabels.${command.labelKey}`) }))
    .filter(({ label }) => !trimmedQuery || label.toLowerCase().includes(trimmedQuery.toLowerCase()));

  const sections: Section[] = [];

  if (filteredCommands.length > 0) {
    sections.push({
      key: "commands",
      label: t("commands"),
      rows: filteredCommands.map(({ command, label }) => ({
        key: `command-${command.id}`,
        icon: Command,
        title: label,
        onSelect: () => runCommand(command),
      })),
    });
  }

  if (!trimmedQuery && recents.length > 0) {
    sections.push({
      key: "recents",
      label: t("recent"),
      rows: recents.map((recent) => ({
        key: `recent-${recent.href}`,
        icon: Clock,
        title: recent.title,
        subtitle: recent.subtitle,
        onSelect: () => runHit(recent),
      })),
    });
  }

  if (trimmedQuery && response) {
    for (const group of response.groups) {
      if (group.items.length === 0) continue;
      sections.push({
        key: group.type,
        label: t(`groups.${group.type}`),
        rows: group.items.map((hit) => ({
          key: `${group.type}-${hit.id}`,
          icon: GROUP_ICONS[group.type],
          title: hit.title,
          subtitle: hit.subtitle,
          onSelect: () => runHit({ ...hit, type: group.type }),
        })),
      });
    }
  }

  const rows = sections.flatMap((section) => section.rows);
  const clampedIndex = rows.length > 0 ? Math.min(activeIndex, rows.length - 1) : 0;
  const noResults = Boolean(trimmedQuery) && !isLoading && !isError && rows.length === 0;

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      rows[clampedIndex]?.onSelect();
    }
  }

  let rowCursor = 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-foreground/40",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />

        <Dialog.Content
          className={cn(
            "fixed start-1/2 top-24 z-50 flex max-h-[70vh] w-[calc(100%-3rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden",
            "rounded-modal bg-popover shadow-lg focus:outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "motion-safe:data-[state=open]:zoom-in-95",
            "motion-safe:data-[state=closed]:zoom-out-95",
            "duration-200",
          )}
        >
          <VisuallyHidden.Root asChild>
            <Dialog.Title>{t("dialogTitle")}</Dialog.Title>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <Dialog.Description>{t("placeholder")}</Dialog.Description>
          </VisuallyHidden.Root>

          <div className="flex items-center gap-3 border-b border-border px-4">
            <Icon icon={Search} size="sm" className="shrink-0 text-icon-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              role="combobox"
              aria-expanded
              aria-controls="admin-search-listbox"
              aria-activedescendant={rows[clampedIndex]?.key}
              autoComplete="off"
              className="h-14 w-full bg-transparent text-body-b2 text-foreground placeholder:text-input-placeholder focus:outline-none"
            />
          </div>

          <div id="admin-search-listbox" role="listbox" className="overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <Spinner size="sm" label={t("loading")} />
              </div>
            )}

            {!isLoading && isError && <p className="px-3 py-10 text-center text-body-b7 text-muted-foreground">{t("error")}</p>}

            {!isLoading &&
              !isError &&
              sections.map((section) => (
                <div key={section.key} className="mb-2 last:mb-0">
                  <p className="px-3 py-1.5 text-label-l2 text-muted-foreground">{section.label}</p>
                  {section.rows.map((row) => {
                    const index = rowCursor;
                    rowCursor += 1;
                    return (
                      <button
                        key={row.key}
                        id={row.key}
                        type="button"
                        role="option"
                        aria-selected={index === clampedIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={row.onSelect}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-input px-3 py-2.5 text-start",
                          index === clampedIndex ? "bg-accent text-accent-foreground" : "text-foreground",
                        )}
                      >
                        <Icon icon={row.icon} size="sm" className="shrink-0 text-icon-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-b2">{row.title}</span>
                          {row.subtitle && <span className="block truncate text-body-b7 text-muted-foreground">{row.subtitle}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

            {!isLoading && !isError && noResults && (
              <p className="px-3 py-10 text-center text-body-b7 text-muted-foreground">{t("noResults", { query: trimmedQuery })}</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
