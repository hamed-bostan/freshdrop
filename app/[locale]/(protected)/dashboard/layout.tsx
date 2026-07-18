import type { ReactNode } from "react";
import { isOwner, requireAdmin } from "@/src/lib/require-admin";
import { DashboardSidebar } from "@/src/presentation/dashboard/DashboardSidebar";

/**
 * Admin shell for the dashboard. Gates the whole `/dashboard` tree to admins
 * (see `requireAdmin`); each server action re-checks independently. A fixed left
 * sidebar (see `DashboardSidebar`) with the section content filling the rest of
 * the width — the storefront's mobile `max-w-md` lives in `(main)`, not here.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar isOwner={await isOwner(session)} />
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
