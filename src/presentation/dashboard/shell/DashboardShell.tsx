"use client";

import * as React from "react";

import type { Permission } from "@/src/domain/entities/Permission";
import { CommandPalette } from "@/src/presentation/dashboard/search/CommandPalette";

import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { NavDrawer } from "./NavDrawer";
import { SIDEBAR_COLLAPSED_COOKIE_MAX_AGE, SIDEBAR_COLLAPSED_COOKIE_NAME } from "./sidebarCollapseCookie";

import type { DashboardViewer } from "./viewer";
import type { ReactNode } from "react";

type DashboardShellProps = {
  permissions: readonly Permission[];
  viewer: DashboardViewer;
  /** The desktop rail's collapsed/expanded choice, read from its cookie in the layout so the first paint already matches. */
  initialSidebarCollapsed: boolean;
  children: ReactNode;
};

/**
 * The dashboard's chrome: the desktop rail, the top bar, and the mobile nav
 * drawer, wrapped around the page body. Owns the state the chrome needs —
 * whether the drawer is open, and whether the `xl`+ rail is collapsed — so the
 * top bar's hamburger and the rail's own toggle always agree with what's drawn.
 */
export function DashboardShell({ permissions, viewer, initialSidebarCollapsed, children }: DashboardShellProps) {
  const [navOpen, setNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(initialSidebarCollapsed);

  function toggleSidebarCollapsed(): void {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      // No reload needed — unlike the locale cookie, this only ever changes a
      // client-side layout choice, not anything the server rendered.
      document.cookie = `${SIDEBAR_COLLAPSED_COOKIE_NAME}=${next ? "1" : "0"}; path=/; max-age=${SIDEBAR_COLLAPSED_COOKIE_MAX_AGE}; samesite=lax`;
      return next;
    });
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        permissions={permissions}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar viewer={viewer} onOpenNav={() => setNavOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-5 lg:px-5">{children}</main>
      </div>

      <NavDrawer open={navOpen} onOpenChange={setNavOpen} permissions={permissions} />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} permissions={permissions} viewerId={viewer.id} />
    </div>
  );
}
