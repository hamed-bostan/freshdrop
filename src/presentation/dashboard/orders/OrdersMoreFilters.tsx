"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { PAYMENT_STATUSES, type PaymentStatus } from "@/src/domain/entities/Order";
import { cn } from "@/src/lib/utils";
import { ListFilterPopover, useListParams } from "@/src/presentation/dashboard/list";
import { Button, Input, PopoverClose } from "@/src/presentation/design-system";

/**
 * The order list's secondary filters — the ones that don't earn a permanent slot
 * in the toolbar but shouldn't be missing either: payment status, and a bound on
 * the order value.
 *
 * Grouped behind one trigger with a single Apply, which is the difference between
 * this and the toolbar's other filters. Those take one answer and navigate on the
 * click. These are set *together* — someone narrowing to "failed payments over
 * $100" means both at once, and navigating between them would page through a
 * result set they never asked to see.
 *
 * The mock this was built from also offered "fulfillment status" and "order
 * source". Neither exists: an order records no fulfillment progress beyond its
 * delivery milestone (which the Status filter already covers), and nothing
 * records where an order came from because there is only one way to place one.
 * They arrive when the data does.
 */
export function OrdersMoreFilters() {
  const t = useTranslations("dashOrders");
  const { searchParams } = useListParams();

  const payment = searchParams.get("payment");
  const min = searchParams.get("min");
  const max = searchParams.get("max");
  const activeCount = [payment, min ?? max].filter(Boolean).length;

  return (
    <ListFilterPopover
      label={t("filterMoreLabel")}
      // A count, not the values: two unrelated filters don't summarise into a
      // phrase, and "2" still answers the question the trigger has to answer —
      // is anything in here narrowing the list.
      value={activeCount > 0 ? String(activeCount) : undefined}
      icon={<SlidersHorizontal aria-hidden className="size-4" />}
      contentClassName="w-72"
    >
      <MoreFiltersForm payment={payment} min={min} max={max} />
    </ListFilterPopover>
  );
}

type MoreFiltersFormProps = {
  payment: string | null;
  min: string | null;
  max: string | null;
};

/**
 * The draft. Inside the panel so it's rebuilt from the URL each time the panel
 * opens — see `CustomRange` in `ListDateRangeFilter` for the same reasoning.
 */
function MoreFiltersForm({ payment, min, max }: MoreFiltersFormProps) {
  const t = useTranslations("dashOrders");
  const { searchParams, setParams } = useListParams();

  const [draftPayment, setDraftPayment] = React.useState(payment ?? "");
  const [draftMin, setDraftMin] = React.useState(min ?? "");
  const [draftMax, setDraftMax] = React.useState(max ?? "");

  const paymentLabels: Record<PaymentStatus, string> = {
    paid: t("filterPaymentPaid"),
    pending: t("filterPaymentPending"),
    failed: t("filterPaymentFailed"),
    refunded: t("filterPaymentRefunded"),
  };

  /** All three in one navigation — see the note on `applyRange`. */
  function apply(): void {
    const next = new URLSearchParams(searchParams);
    for (const [name, value] of [
      ["payment", draftPayment],
      ["min", draftMin],
      ["max", draftMax],
    ] as const) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    next.delete("page");
    setParams(next);
  }

  function clear(): void {
    setDraftPayment("");
    setDraftMin("");
    setDraftMax("");
    const next = new URLSearchParams(searchParams);
    for (const name of ["payment", "min", "max"]) next.delete(name);
    next.delete("page");
    setParams(next);
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <fieldset className="flex flex-col gap-1">
        <legend className="pb-1 text-body-b6 font-medium text-foreground">
          {t("filterPaymentLabel")}
        </legend>
        {[{ value: "", label: t("filterPaymentAll") }, ...PAYMENT_STATUSES.map((status) => ({
          value: status,
          label: paymentLabels[status],
        }))].map((option) => (
          <label
            key={option.value || "all"}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-button px-2 py-1.5 text-body-b5 transition-colors",
              draftPayment === option.value ? "bg-accent text-primary" : "text-foreground hover:bg-accent",
            )}
          >
            {/* A real radio group, not styled buttons: arrow-key navigation
                between the options comes free and is what a keyboard user
                expects of a one-of-many choice. */}
            <input
              type="radio"
              name="payment"
              className="sr-only"
              value={option.value}
              checked={draftPayment === option.value}
              onChange={() => setDraftPayment(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-1 text-body-b6 font-medium text-foreground">
          {t("filterTotalLabel")}
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            aria-label={t("filterTotalMin")}
            placeholder={t("filterTotalMin")}
            value={draftMin}
            onChange={(event) => setDraftMin(event.target.value)}
          />
          <span aria-hidden className="text-body-b6 text-muted-foreground">
            —
          </span>
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            aria-label={t("filterTotalMax")}
            placeholder={t("filterTotalMax")}
            value={draftMax}
            onChange={(event) => setDraftMax(event.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <Button variant="link" size="sm" onClick={clear}>
          {t("filterClearAll")}
        </Button>
        <PopoverClose asChild>
          <Button size="sm" onClick={apply}>
            {t("filterApply")}
          </Button>
        </PopoverClose>
      </div>
    </div>
  );
}
