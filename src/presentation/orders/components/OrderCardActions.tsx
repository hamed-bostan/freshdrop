"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/src/i18n/navigation";
import type { Order } from "@/src/domain/entities/Order";
import { isCancellable, isReturnable } from "@/src/domain/entities/Order";
import { Button } from "@/src/presentation/design-system";
import { ConfirmDialog } from "@/src/presentation/components/ConfirmDialog";
import { ApiError } from "@/src/lib/api/ApiError";
import { useCart } from "@/src/presentation/cart/CartProvider";
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
  const t = useTranslations("orders");
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  const [running, setRunning] = React.useState<RunningAction | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<ConfirmAction | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Live tracking is a courier map + ticking ETA, so it's only meaningful while
  // the order is actually in flight (confirmed/shipped → `processing`). Once it's
  // delivered, returned, cancelled or refunded there's nothing live to follow, so
  // the CTA retires and the card falls back to Return/Reorder.
  const trackable = order.phase === "current" && order.status === "processing";
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
        setError(err instanceof ApiError ? err.message : t("actionError"));
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
      title: t("cancelTitle"),
      description: t("cancelDescription", { amount: `$ ${order.total.toFixed(2)}` }),
      confirmLabel: t("cancelConfirm"),
      pendingLabel: t("cancelling"),
    },
    return: {
      title: t("returnTitle"),
      description: t("returnDescription"),
      confirmLabel: t("returnConfirm"),
      pendingLabel: t("requesting"),
    },
  };

  const actions: React.ReactNode[] = [];

  if (trackable) {
    actions.push(
      <Button key="track" asChild size="sm" disabled={pending}>
        <Link href={`/orders/${order.id}/track`}>{t("trackOrder")}</Link>
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
        {running === "cancel" ? t("cancelling") : t("cancelOrder")}
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
        {running === "return" ? t("requesting") : t("return")}
      </Button>,
    );
  }

  if (returnPending) {
    actions.push(
      <Button key="return-pending" type="button" variant="outline" size="sm" disabled>
        {t("returnRequested")}
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
      onClick={() =>
        run("reorder", () => ordersApi.reorder(order.id), () => {
          // Reorder added the items server-side: resync the shared cart store so
          // the nav badge reflects them, then navigate to the cart and refresh.
          refreshCart();
          router.push("/cart");
          router.refresh();
        })
      }
    >
      {running === "reorder" ? t("adding") : t("reorder")}
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
          cancelLabel={confirm === "cancel" ? t("keepOrder") : t("notNow")}
          pending={pending}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
