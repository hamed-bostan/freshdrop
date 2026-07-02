"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/src/domain/entities/Order";
import { isCancellable, isReturnable } from "@/src/domain/entities/Order";
import { Button } from "@/src/presentation/design-system";
import { ConfirmDialog } from "@/src/presentation/components/ConfirmDialog";
import { ApiError } from "@/src/lib/api/ApiError";
import { ordersApi } from "../order-api";

/** Which mutation is in flight — drives the per-button loading label. */
type RunningAction = "reorder" | "cancel" | "return";

/** The actions that ask for confirmation first (they move money/stock). */
type ConfirmAction = "cancel" | "return";

interface OrderCardActionsProps {
  order: Order;
}

/**
 * The action row under an order. Which buttons appear is driven entirely by the
 * order's state (the same `isCancellable`/`isReturnable` rules the server
 * enforces), so the UI never offers an action the API would reject. Reorder is
 * always available. Each mutation goes over the REST service, then Reorder
 * navigates to the cart while cancel/return `router.refresh()` the server render
 * — the server stays the source of truth, no local order copy to patch.
 */
export function OrderCardActions({ order }: OrderCardActionsProps) {
  const router = useRouter();
  const [running, setRunning] = React.useState<RunningAction | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<ConfirmAction | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Mirror the tracking route's rule: only live, non-cancelled orders can be tracked.
  const trackable = order.phase === "current" && order.status !== "cancelled" && order.status !== "refunded";
  const cancellable = isCancellable(order);
  const returnable = isReturnable(order);
  const returnPending = order.status === "return_requested";

  // Clear the loading label once the transition (mutation + refresh) settles.
  React.useEffect(() => {
    if (!pending) setRunning(null);
  }, [pending]);

  function run(action: RunningAction, mutate: () => Promise<unknown>, onSuccess: () => void): void {
    setError(null);
    setRunning(action);
    startTransition(async () => {
      try {
        await mutate();
        onSuccess();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        setRunning(null);
        // Close any open confirmation so the inline error isn't hidden behind it.
        setConfirm(null);
      }
    });
  }

  /** Run the action the confirmation dialog is asking about, then close it. */
  function handleConfirm(): void {
    if (confirm === "cancel") {
      run("cancel", () => ordersApi.cancel(order.id), () => {
        setConfirm(null);
        router.refresh();
      });
    } else if (confirm === "return") {
      run("return", () => ordersApi.requestReturn(order.id), () => {
        setConfirm(null);
        router.refresh();
      });
    }
  }

  const confirmCopy: Record<ConfirmAction, { title: string; description: string; confirmLabel: string; pendingLabel: string }> = {
    cancel: {
      title: "Cancel this order?",
      description: `We'll return the items to stock and refund $ ${order.total.toFixed(2)} to your wallet. This can't be undone.`,
      confirmLabel: "Cancel order",
      pendingLabel: "Cancelling…",
    },
    return: {
      title: "Request a return?",
      description: "We'll submit a return request for this order. Once it's approved you'll be refunded to your wallet.",
      confirmLabel: "Request return",
      pendingLabel: "Requesting…",
    },
  };

  const actions: React.ReactNode[] = [];

  if (trackable) {
    actions.push(
      <Button key="track" asChild size="sm" disabled={pending}>
        <Link href={`/orders/${order.id}/track`}>Track Order</Link>
      </Button>,
    );
  }

  if (cancellable) {
    actions.push(
      <Button
        key="cancel"
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setConfirm("cancel")}
      >
        {running === "cancel" ? "Cancelling…" : "Cancel Order"}
      </Button>,
    );
  }

  if (returnable) {
    actions.push(
      <Button
        key="return"
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setConfirm("return")}
      >
        {running === "return" ? "Requesting…" : "Return"}
      </Button>,
    );
  }

  if (returnPending) {
    actions.push(
      <Button key="return-pending" type="button" variant="outline" size="sm" disabled>
        Return requested
      </Button>,
    );
  }

  actions.push(
    <Button
      key="reorder"
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => run("reorder", () => ordersApi.reorder(order.id), () => router.push("/cart"))}
    >
      {running === "reorder" ? "Adding…" : "Reorder"}
    </Button>,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className={actions.length === 1 ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2"}>
        {actions}
      </div>
      {error && (
        <p role="alert" className="text-body-b10 text-destructive">
          {error}
        </p>
      )}

      {confirm && (
        <ConfirmDialog
          open
          // Don't let a click-away dismiss while the mutation is running.
          onOpenChange={(next) => {
            if (!next && !pending) setConfirm(null);
          }}
          title={confirmCopy[confirm].title}
          description={confirmCopy[confirm].description}
          confirmLabel={confirmCopy[confirm].confirmLabel}
          pendingLabel={confirmCopy[confirm].pendingLabel}
          confirmVariant={confirm === "cancel" ? "outline" : "primary"}
          cancelLabel={confirm === "cancel" ? "Keep order" : "Not now"}
          pending={pending}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
