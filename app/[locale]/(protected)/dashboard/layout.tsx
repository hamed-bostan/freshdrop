import type { ReactNode } from "react";
import { requirePermission, sessionPermissions } from "@/src/lib/require-permission";
import { DashboardSidebar } from "@/src/presentation/dashboard/DashboardSidebar";

/**
 * Shell for the dashboard. Gates the whole `/dashboard` tree on `dashboard.view`,
 * which every dashboard role holds and no customer does; each page and endpoint
 * re-checks the *specific* permission it needs, so this is the door rather than the
 * whole lock. A fixed left sidebar (see `DashboardSidebar`) with the section
 * content filling the rest of the width — the storefront's mobile `max-w-md` lives
 * in `(main)`, not here.
 *
 * The viewer's permissions are resolved once here and handed to the sidebar, which
 * hides the sections they can't use. That's presentation only: a link nobody can
 * follow is noise, but hiding it is not what stops them — the routes do.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requirePermission("dashboard.view");

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar permissions={await sessionPermissions(session)} />
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
