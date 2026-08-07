"use client";

import { useTranslations } from "next-intl";
import * as React from "react";

import type { Order } from "@/src/domain/entities/Order";
import type {
  ReturnItemCondition,
  ReturnRecoveryDecision,
  ReturnRequest,
} from "@/src/domain/entities/Return";
import { RETURN_ITEM_CONDITIONS, RETURN_RECOVERY_DECISIONS } from "@/src/domain/entities/Return";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, FormMessage, Select } from "@/src/presentation/design-system";

import { ordersApi } from "./order-api";

type OrderReturnInspectionProps = {
  orderId: string;
  returnRequest: ReturnRequest;
  /** For labelling each return line with the product name — the return item
   * itself only carries the id/quantity. */
  orderItems: Order["items"];
};

// Typed with literal (not `string`) values so `t(CONDITION_LABEL_KEYS[x])` keeps
// enough type information for next-intl to check the key against the message
// namespace — a `Record<_, string>` would erase that and fail the check.
const CONDITION_LABEL_KEYS = {
  unopened: "conditionUnopened",
  resellable: "conditionResellable",
  damaged: "conditionDamaged",
  expired: "conditionExpired",
  missing_parts: "conditionMissingParts",
} as const satisfies Record<ReturnItemCondition, string>;

const RECOVERY_LABEL_KEYS = {
  restocked: "recoveryRestocked",
  returned_to_supplier: "recoveryReturnedToSupplier",
  discounted: "recoveryDiscounted",
  disposed: "recoveryDisposed",
  pending: "recoveryPending",
} as const satisfies Record<ReturnRecoveryDecision, string>;

/**
 * Per-item inspection entry for a pending return: condition + recovery
 * decision, one row per `ReturnItem`. Optional — `ResolveOrderReturn.approve`
 * doesn't require it, but an item that skips it restocks nothing (the safe
 * default), so this is how an admin makes a genuinely resellable return
 * actually go back on the shelf.
 */
export function OrderReturnInspection({ orderId, returnRequest, orderItems }: OrderReturnInspectionProps) {
  const t = useTranslations("dashOrders");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [draft, setDraft] = React.useState<Record<string, { condition: ReturnItemCondition; recoveryDecision: ReturnRecoveryDecision }>>(
    () =>
      Object.fromEntries(
        returnRequest.items.map((item) => [
          item.id,
          { condition: item.condition ?? "resellable", recoveryDecision: item.recoveryDecision ?? "restocked" },
        ]),
      ),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function updateDraft(itemId: string, patch: Partial<{ condition: ReturnItemCondition; recoveryDecision: ReturnRecoveryDecision }>): void {
    setDraft((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
  }

  function submit(): void {
    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.recordReturnInspection(orderId, {
          items: returnRequest.items.map((item) => ({
            returnItemId: item.id,
            condition: draft[item.id].condition,
            recoveryDecision: draft[item.id].recoveryDecision,
          })),
        });
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("inspectError")));
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-card-md border border-border bg-background p-3">
      <ul className="flex flex-col gap-3">
        {returnRequest.items.map((item) => {
          const line = orderItems.find((oi) => oi.id === item.orderItemId);
          const current = draft[item.id];
          return (
            <li key={item.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-body-b7 text-foreground">
                  {line?.name ?? item.productId}
                </span>
                <span className="shrink-0 text-body-b9 text-muted-foreground">
                  {item.condition ? t("inspected") : t("notInspected")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  aria-label={t("conditionLabel")}
                  size="sm"
                  value={current.condition}
                  disabled={pending}
                  onChange={(event) => updateDraft(item.id, { condition: event.target.value as ReturnItemCondition })}
                >
                  {RETURN_ITEM_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {t(CONDITION_LABEL_KEYS[condition])}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label={t("recoveryDecisionLabel")}
                  size="sm"
                  value={current.recoveryDecision}
                  disabled={pending}
                  onChange={(event) =>
                    updateDraft(item.id, { recoveryDecision: event.target.value as ReturnRecoveryDecision })
                  }
                >
                  {RETURN_RECOVERY_DECISIONS.map((decision) => (
                    <option key={decision} value={decision}>
                      {t(RECOVERY_LABEL_KEYS[decision])}
                    </option>
                  ))}
                </Select>
              </div>
            </li>
          );
        })}
      </ul>

      {error && <FormMessage>{error}</FormMessage>}

      <Button type="button" size="sm" disabled={pending} onClick={submit} className="self-start">
        {pending ? t("inspectPending") : t("inspectSubmit")}
      </Button>
    </div>
  );
}
