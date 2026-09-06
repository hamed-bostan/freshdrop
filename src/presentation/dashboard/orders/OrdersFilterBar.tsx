"use client";

import { CalendarDays, Truck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { DELIVERY_TYPES, type DeliveryType } from "@/src/domain/entities/Order";
import {
  ORDER_PIPELINE_STAGES,
  type OrderPipelineStage,
} from "@/src/domain/entities/OrderPipelineStage";
import {
  ListChoiceFilter,
  ListDateRangeFilter,
  ListFilterReset,
} from "@/src/presentation/dashboard/list";

import { OrdersMoreFilters } from "./OrdersMoreFilters";

/** Every param the bar writes — what Reset clears, and nothing else. */
const ORDER_FILTER_PARAMS = ["q", "pipeline", "delivery", "payment", "from", "to", "min", "max"];

type OrdersFilterBarProps = {
  /**
   * How many orders sit at each pipeline stage, for the counts in the Status
   * panel. Optional — the bar renders without them.
   */
  pipelineCounts?: Record<string, number>;
};

/**
 * The order list's filter row: status, date, delivery type, everything else, and
 * a reset.
 *
 * A client component because every control here writes to the query string, but
 * it holds no data — the rows it narrows are fetched by the server render that
 * the navigation re-runs. The screen around it stays a Server Component.
 *
 * All four filters are the same control (see `ListFilterPopover`) rather than a
 * mix of selects and buttons, which is the point of the row: an operator reads
 * it as one bar of filters, not as four separately-invented widgets.
 */
export function OrdersFilterBar({ pipelineCounts }: OrdersFilterBarProps) {
  const t = useTranslations("dashOrders");
  const format = useFormatter();

  const pipelineLabels: Record<OrderPipelineStage, string> = {
    in_progress: t("filterPipelineInProgress"),
    pending: t("filterPipelinePending"),
    confirmed: t("filterPipelineConfirmed"),
    out_for_delivery: t("filterPipelineOutForDelivery"),
    delivered: t("filterPipelineDelivered"),
    return_requested: t("filterPipelineReturnRequested"),
    cancelled: t("filterPipelineCancelled"),
    refunded: t("filterPipelineRefunded"),
  };

  const deliveryLabels: Record<DeliveryType, string> = {
    delivery: t("filterDeliveryCouriered"),
    pickup: t("filterDeliveryPickup"),
  };

  /** A date as the operator's locale writes it — the trigger has room for no more. */
  const shortDate = (iso: string | null): string | null =>
    iso ? format.dateTime(new Date(iso), { day: "numeric", month: "short" }) : null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 [&>button]:min-h-11 [&>button]:max-w-full [&>button]:grow @min-[36rem]:[&>button]:grow-0">
      <ListChoiceFilter
        paramName="pipeline"
        label={t("filterStatusLabel")}
        allLabel={t("filterStatusAll")}
        showAllValue
        options={ORDER_PIPELINE_STAGES.map((stage) => ({
          value: stage,
          label: pipelineLabels[stage],
        }))}
        counts={pipelineCounts}
      />

      <ListDateRangeFilter
        label={t("filterDateLabel")}
        inactiveValue={t("filterDateAll")}
        icon={<CalendarDays aria-hidden className="size-4" />}
        labels={{
          today: t("filterDateToday"),
          yesterday: t("filterDateYesterday"),
          last7: t("filterDateLast7"),
          last30: t("filterDateLast30"),
          thisMonth: t("filterDateThisMonth"),
          custom: t("filterDateCustom"),
          from: t("filterDateFrom"),
          to: t("filterDateTo"),
          apply: t("filterApply"),
          clear: t("filterClear"),
          // A half-open range reads as one bound, not as a range with a hole in
          // it: "Since 3 Jul" and "Until 3 Jul" are what those URLs mean.
          rangeValue: (from, to) => {
            if (from && to) return `${shortDate(from)} – ${shortDate(to)}`;
            if (from) return t("filterDateSince", { date: shortDate(from) ?? "" });
            return t("filterDateUntil", { date: shortDate(to) ?? "" });
          },
        }}
      />

      <ListChoiceFilter
        paramName="delivery"
        label={t("filterDeliveryLabel")}
        allLabel={t("filterDeliveryAll")}
        showAllValue
        icon={<Truck aria-hidden className="size-4" />}
        options={DELIVERY_TYPES.map((type) => ({ value: type, label: deliveryLabels[type] }))}
      />

      <OrdersMoreFilters />

      <ListFilterReset label={t("filterReset")} paramNames={ORDER_FILTER_PARAMS} />
    </div>
  );
}
