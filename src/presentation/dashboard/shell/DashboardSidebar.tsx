"use client";

import type { Permission } from "@/src/domain/entities/Permission";
import { DashboardNav } from "./DashboardNav";
import { SidebarBrand } from "./SidebarBrand";
import { UserCard } from "./UserCard";
import { ViewStoreLink } from "./ViewStoreLink";
import type { DashboardViewer } from "./viewer";

type DashboardSidebarProps = {
  /** What the viewer may do — decides which sections are offered. */
  permissions: readonly Permission[];
  /** Who's signed in — the user card at the bottom of the rail. */
  viewer: DashboardViewer;
};

/**
 * Persistent left rail for `lg` and up (below that, `NavDrawer` takes over).
 * Collapses to an icon-only rail between `lg` and `xl` to keep the page body
 * roomy on medium desktops, then expands to the full labelled rail at `xl`.
 *
 * Both widths render the same brand/nav/user-card/view-store pieces — one pair
 * hidden behind the other's breakpoint via CSS only — so collapsing never needs
 * its own client state and there is exactly one source for the section list.
 */
export function DashboardSidebar({ permissions, viewer }: DashboardSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-border bg-background lg:flex lg:w-[76px] xl:w-64">
      <div className="xl:hidden">
        <SidebarBrand collapsed />
      </div>
      <div className="hidden xl:block">
        <SidebarBrand />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="xl:hidden">
          <DashboardNav permissions={permissions} collapsed />
        </div>
        <div className="hidden xl:block">
          <DashboardNav permissions={permissions} />
        </div>
      </div>

      <div className="xl:hidden">
        <UserCard viewer={viewer} collapsed />
      </div>
      <div className="hidden xl:block">
        <UserCard viewer={viewer} />
      </div>

      <div className="xl:hidden">
        <ViewStoreLink collapsed />
      </div>
      <div className="hidden xl:block">
        <ViewStoreLink />
      </div>
    </aside>
  );
}
