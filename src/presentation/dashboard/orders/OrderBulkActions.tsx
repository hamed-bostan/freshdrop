"use client";

import { ChevronDown, CircleSlash, PackageCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import type { OrderBulkAction } from "@/src/contracts/bulk-action-schema";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { useBulkSelection } from "@/src/presentation/dashboard/bulk";
import {
  Button,
  ConfirmSheet,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/presentation/design-system";

import { ordersApi } from "./order-api";

/** The milestones offered, in the order an order passes through them. */
const STAGES: TrackingMilestone[] = ["confirmed", "shipped", "arrived"];

/**
 * The order list's bulk actions: move a selection to a delivery stage, or cancel it.
 *
 * Two verbs where the mock had seven. The others were either a different feature
 * (print invoices — there is no invoice), a rewording of one of these (mark as
 * delivered *is* the `arrived` stage), or something an order should not have done
 * to it in bulk: refunds are a per-order decision about that order's contents, and
 * deleting an order at all would be destroying a financial record.
 *
 * Cancelling confirms first, and says how many and that money moves, because it is
 * the one action here that can't be walked back — it restocks every line and
 * credits every customer's wallet. Advancing a stage doesn't confirm: it's
 * reversible by advancing again, which is exactly the property that decides which
 * actions get a dialog.
 *
 * Reads the selection from context rather than props, like `ProductBulkActions` —
 * the bar around it is rendered from a Server Component, which can't hand a client
 * component a callback.
 */
export function OrderBulkActions() {
  const t = useTranslations("dashOrders");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const { selected, clear } = useBulkSelection();
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const stageLabels: Record<TrackingMilestone, string> = {
    confirmed: t("bulkStageConfirmed"),
    shipped: t("bulkStageShipped"),
    arrived: t("bulkStageArrived"),
  };

  function apply(action: OrderBulkAction): void {
    setError(null);
    startTransition(async () => {
      try {
        const { updated } = await ordersApi.bulkUpdate(selected, action);
        // Re-run the server render so the rows reflect the change.
        router.refresh();

        if (updated < selected.length) {
          // Some orders couldn't take the action, and saying so is the difference
          // between a silent partial success and a visible one. The selection is
          // deliberately *not* cleared here: this bar only renders while something
          // is selected, so clearing would unmount the very message being set.
          // Leaving it holds the notice on screen until the operator dismisses it
          // with "clear selection", or until the refreshed page brings different
          // ids in and the provider resets anyway.
          setError(t("bulkPartial", { updated, total: selected.length }));
        } else {
          // Everything moved, so there's nothing to report — drop the selection,
          // whose rows have just been replaced.
          clear();
        }
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("bulkError")));
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            {t("bulkActions")}
            <ChevronDown aria-hidden className="ms-1.5 size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Truck aria-hidden className="size-4" />
              {t("bulkSetStage")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STAGES.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onSelect={() => apply({ type: "setStage", stage })}
                >
                  {stage === "arrived" ? (
                    <PackageCheck aria-hidden className="size-4" />
                  ) : (
                    <Truck aria-hidden className="size-4" />
                  )}
                  {stageLabels[stage]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem destructive onSelect={() => setConfirmingCancel(true)}>
            <CircleSlash aria-hidden className="size-4" />
            {t("bulkCancel")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error ? (
        // `role="status"`, not `alert`: a partial result is the commonest thing
        // this says, and it is information rather than an interruption.
        <p role="status" className="text-body-b8 text-error-foreground">
          {error}
        </p>
      ) : null}

      <ConfirmSheet
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t("bulkCancelConfirmTitle", { count: selected.length })}
        message={t("bulkCancelConfirmBody")}
        confirmLabel={t("bulkCancelConfirm")}
        onConfirm={() => apply({ type: "cancel" })}
      />
    </>
  );
}
