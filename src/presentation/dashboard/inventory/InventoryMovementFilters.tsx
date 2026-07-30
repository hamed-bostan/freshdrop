"use client";

import { CalendarDays } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  STOCK_MOVEMENT_DIRECTIONS,
  STOCK_MOVEMENT_REASONS,
} from "@/src/domain/entities/StockMovement";
import {
  ListDateRangeFilter,
  ListFilterSelect,
} from "@/src/presentation/dashboard/list";

/** Exact filters for the inventory ledger; every value is URL-backed and server-evaluated. */
export function InventoryMovementFilters() {
  const t = useTranslations("dashInventory");
  const tProducts = useTranslations("dashProducts");
  const format = useFormatter();
  const shortDate = (iso: string | null): string | null =>
    iso ? format.dateTime(new Date(iso), { day: "numeric", month: "short" }) : null;

  return (
    <>
      <ListFilterSelect
        paramName="movement"
        label={t("filterMovementLabel")}
        options={[
          { value: "", label: t("filterMovementAll") },
          ...STOCK_MOVEMENT_DIRECTIONS.map((direction) => ({
            value: direction,
            label: t(`movementDirection.${direction}`),
          })),
        ]}
      />
      <ListFilterSelect
        paramName="reason"
        label={t("filterReasonLabel")}
        options={[
          { value: "", label: t("filterReasonAll") },
          ...STOCK_MOVEMENT_REASONS.map((reason) => ({
            value: reason,
            label: tProducts(`adjustReason.${reason}`),
          })),
        ]}
      />
      <ListDateRangeFilter
        label={t("filterDateLabel")}
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
          rangeValue: (from, to) => {
            if (from && to) return `${shortDate(from)} – ${shortDate(to)}`;
            if (from) return t("filterDateSince", { date: shortDate(from) ?? "" });
            return t("filterDateUntil", { date: shortDate(to) ?? "" });
          },
        }}
      />
    </>
  );
}
