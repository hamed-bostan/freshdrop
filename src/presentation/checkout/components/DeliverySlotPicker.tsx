"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import type { DeliverySlot, DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { SelectableTile } from "@/src/presentation/design-system";

import { slotDayLabel, slotName, slotTimeRange } from "../deliverySlotFormat";

/** The shopper's chosen slot — a day plus a window within it. */
export type SlotSelection = { date: string; windowId: string };

interface DeliverySlotPickerProps {
  days: DeliverySlotDay[];
  selected: SlotSelection | null;
  onSelect: (selection: SlotSelection) => void;
}

/**
 * The "Delivery Time" picker: a row of day pills (Today / Tomorrow / …) that
 * reveals that day's bookable windows. Windows are native radios in one group
 * (keyboard-navigable), each showing its time range and remaining capacity; a full
 * window is disabled. Selection is lifted to the checkout screen as {@link SlotSelection}.
 */
export function DeliverySlotPicker({ days, selected, onSelect }: DeliverySlotPickerProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  // Which day's windows are shown. Follows the selected slot's day, else the first.
  const [activeDate, setActiveDate] = React.useState(() => selected?.date ?? days[0]?.date ?? "");

  // When the selection's day changes on its own — e.g. a slot restored from a
  // previous session lands on a different day than the default — bring that day's
  // tab into view so the restored window is visibly selected. During normal use the
  // selection's day always equals the active day, so this is a no-op then.
  const selectedDate = selected?.date;
  React.useEffect(() => {
    if (selectedDate) setActiveDate(selectedDate);
  }, [selectedDate]);

  const activeDay = days.find((day) => day.date === activeDate) ?? days[0];

  if (!activeDay) {
    return <p className="text-body-b8 text-muted-foreground">{t("noSlots")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={t("dayAria")} className="scrollbar-hide -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0">
        {days.map((day) => (
          <button key={day.date} type="button" role="tab" aria-selected={day.date === activeDay.date}
            onClick={() => setActiveDate(day.date)}
            className={day.date === activeDay.date
              ? "min-h-20 w-[92px] shrink-0 snap-start rounded-xl border border-primary bg-primary/5 px-2 py-3 text-center text-sm font-semibold text-primary sm:min-h-24 sm:w-auto sm:rounded-2xl sm:px-3 sm:py-4 sm:text-base"
              : "min-h-20 w-[92px] shrink-0 snap-start rounded-xl border border-border bg-background px-2 py-3 text-center text-sm font-medium text-foreground sm:min-h-24 sm:w-auto sm:rounded-2xl sm:px-3 sm:py-4 sm:text-base"}>
            {slotDayLabel(day, locale, t)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {activeDay.slots.map((slot) => (
          <SlotOption
            key={slot.windowId}
            slot={slot}
            selected={selected?.date === activeDay.date && selected.windowId === slot.windowId}
            onSelect={() => onSelect({ date: activeDay.date, windowId: slot.windowId })}
            disabled={slot.availability.level === "full"}
          />
        ))}
      </div>
    </div>
  );
}

interface SlotOptionProps {
  slot: DeliverySlot;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

/**
 * One bookable window, rendered as a design-system radio tile (the day's windows
 * form one keyboard-navigable group). A full window is disabled and dimmed.
 * Availability is only surfaced when it matters — "Full" when booked out, an
 * "Only N left" nudge when low (the same scarcity cue as the product cards),
 * nothing when there's plenty.
 */
function SlotOption({ slot, selected, onSelect, disabled }: SlotOptionProps) {
  const t = useTranslations("checkout");
  const tSlots = useTranslations("checkout.slots");
  const locale = useLocale();
  const { availability } = slot;

  // Window name from the localized catalog (keyed by the stable window id, like the
  // payment-method labels); an unknown id falls back to the stored English name.
  const name = slotName(slot.windowId, slot.label, tSlots);
  const timeRange = slotTimeRange(slot.windowId, slot.timeRange, locale);

  return (
    <SelectableTile
      name="delivery-slot"
      value={slot.windowId}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      align="between"
      className={selected ? "min-h-24 border-primary bg-primary/5 px-4 text-center sm:min-h-28 sm:px-6" : "min-h-24 border-border bg-background px-4 text-center sm:min-h-28 sm:px-6"}
    >
      <span className="flex w-full flex-col gap-2">
        <span className={selected ? "text-lg font-semibold text-primary" : "text-lg font-semibold text-foreground"}>{name}</span>
        <span className="text-base text-muted-foreground">{timeRange}</span>
      </span>

      {availability.level === "full" ? (
        <span className="shrink-0 text-body-b10 text-destructive">{t("full")}</span>
      ) : availability.level === "low" ? (
        <span className="shrink-0 text-body-b10 text-warning-foreground">
          {t("slotOnlyLeft", { count: availability.remaining })}
        </span>
      ) : null}
    </SelectableTile>
  );
}
