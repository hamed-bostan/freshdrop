"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { ConfirmDialog } from "@/src/presentation/components/ConfirmDialog";
import { Button, FormMessage } from "@/src/presentation/design-system";

import { ordersApi } from "./order-api";

type OrderReturnControlProps = {
  orderId: string;
};

/**
 * Per-row Approve/Reject control for an order with a pending return request.
 * Approving refunds the customer (restock + wallet credit) server-side; both
 * decisions write over the REST API and then `router.refresh()` re-runs the
 * server render so the row reflects the new status — same server-as-source-of-
 * truth pattern as the stage select. A failed write shows inline.
 */
export function OrderReturnControl({ orderId }: OrderReturnControlProps) {
  const t = useTranslations("dashOrders");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [confirmingApprove, setConfirmingApprove] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function resolve(decision: "approve" | "reject"): void {
    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.resolveReturn(orderId, { decision });
        setConfirmingApprove(false);
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("returnError")));
        setConfirmingApprove(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {/* Approving moves money (restock + wallet refund), so it's confirmed first. */}
        <Button type="button" size="sm" disabled={pending} onClick={() => setConfirmingApprove(true)}>
          {t("approve")}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => resolve("reject")}>
          {t("reject")}
        </Button>
      </div>
      {error && (
        <FormMessage className="max-w-48 text-end">{error}</FormMessage>
      )}

      {confirmingApprove && (
        <ConfirmDialog
          open
          onOpenChange={(next) => {
            if (!next && !pending) setConfirmingApprove(false);
          }}
          title={t("approveTitle")}
          description={t("approveDescription")}
          confirmLabel={t("approveConfirm")}
          pendingLabel={t("approvePending")}
          cancelLabel={t("notNow")}
          pending={pending}
          onConfirm={() => resolve("approve")}
        />
      )}
    </div>
  );
}
