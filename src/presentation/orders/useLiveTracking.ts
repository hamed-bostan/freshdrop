"use client";

import * as React from "react";

import type { OrderTracking } from "@/src/domain/entities/OrderTracking";

import { ordersApi } from "./order-api";

/** How often to re-fetch the courier position while a delivery is en route. */
const POLL_INTERVAL_MS = 10_000;

/** Whether the delivery has reached the door — the point where polling stops. */
function hasArrived(tracking: OrderTracking): boolean {
  return tracking.steps.find((step) => step.status === "current")?.milestone === "arrived";
}

/**
 * Keeps an order's tracking fresh by polling the tracking endpoint, seeded from
 * the server-rendered `initial` so the first paint is instant and SSR-correct.
 *
 * Polling runs only while the courier is en route and the tab is visible, and a
 * `setTimeout` chain (not `setInterval`) prevents overlapping in-flight requests.
 * A transient poll failure is swallowed — the last good state stays on screen and
 * the next tick retries. Returns the newest tracking for the screen to render;
 * the map component animates the courier marker between these updates.
 */
export function useLiveTracking(initial: OrderTracking): OrderTracking {
  const [tracking, setTracking] = React.useState(initial);

  // Re-seed if the server hands down fresh data (e.g. after a router.refresh).
  React.useEffect(() => setTracking(initial), [initial]);

  const orderId = initial.orderId;
  const arrived = hasArrived(tracking);

  React.useEffect(() => {
    if (arrived) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (): void => {
      timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    };

    const tick = async (): Promise<void> => {
      if (typeof document === "undefined" || document.visibilityState !== "hidden") {
        try {
          const next = await ordersApi.getTracking(orderId);
          if (!cancelled && next) setTracking(next);
        } catch {
          // Transient network/poll error — keep the last good state, retry next tick.
        }
      }
      if (!cancelled) schedule();
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [arrived, orderId]);

  return tracking;
}
