"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import { Button, FormMessage } from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { STAGE_LABEL_KEYS } from "./orderStages";
import { ordersApi } from "./order-api";

type OrderStageAdvanceProps = {
  orderId: string;
  /** The milestone this advances the order to (the computed next stage). */
  next: TrackingMilestone;
};

/**
 * The order-detail primary action: advance the delivery to its next milestone. Writes
 * the new stage over the REST API, then `router.refresh()` re-runs the server render so
 * the stepper and status reflect it — the same server-as-source-of-truth pattern as the
 * old per-row select, reduced to a single forward step. A failed write shows inline.
 */
export function OrderStageAdvance({ orderId, next }: OrderStageAdvanceProps) {
  const t = useTranslations("dashOrders");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function advance(): void {
    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.setTrackingStage(orderId, { stage: next });
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("stageError")));
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button type="button" onClick={advance} disabled={pending}>
        {pending ? t("advancePending") : t("advanceTo", { stage: t(STAGE_LABEL_KEYS[next]) })}
      </Button>
      {error && (
        <FormMessage>{error}</FormMessage>
      )}
    </div>
  );
}
