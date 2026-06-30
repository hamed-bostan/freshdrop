"use client";

import { RotateCcw } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";

/**
 * Orders error boundary, covering the list and the track segment. A failed server
 * fetch (the orders / tracking REST calls) renders here with a retry that re-runs
 * the segment — the App Router replacement for a hand-rolled "try again".
 */
export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-1 px-6 pb-24 text-center">
      <p className="text-body-b4 text-foreground">Something went wrong</p>
      <p className="text-body-b6 text-muted-foreground">
        We couldn&apos;t load your orders. Please try again.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
        <Icon icon={RotateCcw} size="sm" className="mr-1.5" />
        Try again
      </Button>
    </div>
  );
}
