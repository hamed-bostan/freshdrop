import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/src/lib/require-admin";
import { DashboardNav } from "@/src/presentation/dashboard/DashboardNav";

/**
 * Admin shell for the dashboard. Gates the whole `/dashboard` tree to admins
 * (see `requireAdmin`); each server action re-checks independently. Desktop-width
 * — the storefront's mobile `max-w-md` lives in `(main)`, not here.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-heading-h3 text-foreground">
            FreshDrop <span className="text-primary">Admin</span>
          </Link>
          <DashboardNav />
          <Link href="/" className="text-body-b7 text-muted-foreground transition-colors hover:text-foreground">
            View store
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
