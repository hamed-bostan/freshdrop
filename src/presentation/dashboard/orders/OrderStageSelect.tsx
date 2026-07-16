"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { ordersApi } from "./order-api";

/** The advanceable milestones, in delivery order, keyed to their dashboard labels. */
const STAGES: { value: TrackingMilestone; labelKey: "stageConfirmed" | "stageShipped" | "stageArrived" }[] = [
  { value: "confirmed", labelKey: "stageConfirmed" },
  { value: "shipped", labelKey: "stageShipped" },
  { value: "arrived", labelKey: "stageArrived" },
];

/** Native-select styling matching the DS field family (no DS Select yet — same as ProductForm). */
const SELECT_CLASSES =
  "h-9 rounded-input border border-border bg-input px-2.5 text-body-b7 text-input-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type OrderStageSelectProps = {
  orderId: string;
  stage: TrackingMilestone;
};

/**
 * Per-row delivery-stage control. Changing the select writes the new stage over
 * the REST API, then `router.refresh()` re-runs the server render so the table
 * (and the customer tracking screen) reflect it — the server stays the source of
 * truth, no local copy to keep in sync. A failed write reverts and shows inline.
 */
export function OrderStageSelect({ orderId, stage }: OrderStageSelectProps) {
  const t = useTranslations("dashOrders");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const next = event.target.value as TrackingMilestone;
    if (next === stage) return;

    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.setTrackingStage(orderId, { stage: next });
        router.refresh();
      } catch (err) {
        const message = localizeApiError(err, tApiErrors, t("stageError"));
        setError(message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        className={SELECT_CLASSES}
        value={stage}
        onChange={handleChange}
        disabled={pending}
        aria-label={t("stageAria", { id: orderId })}
      >
        {STAGES.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="max-w-48 text-end text-body-b10 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
