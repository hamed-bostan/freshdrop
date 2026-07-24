"use client";

import * as React from "react";
import type { ReactNode } from "react";
import type { Permission } from "@/src/domain/entities/Permission";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { NavDrawer } from "./NavDrawer";
import type { DashboardViewer } from "./viewer";

type DashboardShellProps = {
  permissions: readonly Permission[];
  viewer: DashboardViewer;
  children: ReactNode;
};

/**
 * The dashboard's chrome: the desktop rail, the top bar, and the mobile nav
 * drawer, wrapped around the page body. Owns the one piece of state the chrome
 * needs — whether the drawer is open — so the top bar's hamburger and the
 * drawer itself always agree.
 */
export function DashboardShell({ permissions, viewer, children }: DashboardShellProps) {
  const [navOpen, setNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar permissions={permissions} viewer={viewer} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar viewer={viewer} onOpenNav={() => setNavOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <NavDrawer open={navOpen} onOpenChange={setNavOpen} permissions={permissions} viewer={viewer} />
    </div>
  );
}
