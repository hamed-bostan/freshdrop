"use client";

import { RotateCcw } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";

/**
 * Dashboard error boundary. A failed server fetch (e.g. the categories REST call)
 * renders here with a retry that re-runs the segment — the App Router replacement
 * for a hand-rolled "try again" on a client fetch.
 */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="text-body-b4 text-foreground">Something went wrong</p>
      <p className="mt-1 text-body-b6 text-muted-foreground">
        We couldn&apos;t load this page. Please try again.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
        <Icon icon={RotateCcw} size="sm" className="mr-1.5" />
        Try again
      </Button>
    </div>
  );
}
