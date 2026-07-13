"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/utils";
import type { DeliverySlot, DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { faJalaliDate, faWindowRange } from "@/src/lib/deliveryWindowFormat";
import { Chip, ChipGroup } from "@/src/presentation/design-system";

/** The shopper's chosen slot — a day plus a window within it. */
export type SlotSelection = { date: string; windowId: string };

/** Window ids with a localized name under `checkout.slots`; others fall back to the stored name. */
const SLOT_NAME_KEYS = ["morning", "midday", "afternoon", "evening"] as const;
type SlotNameKey = (typeof SLOT_NAME_KEYS)[number];

const isSlotNameKey = (windowId: string): windowId is SlotNameKey =>
  (SLOT_NAME_KEYS as readonly string[]).includes(windowId);

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

  // English shows the domain's snapshot as-is; `fa` localizes the relative label and
  // re-derives dated days as a Jalali date (the today/tomorrow standing is decided
  // server-side, so no store-relative date math runs on the client).
  const dayLabel = (day: DeliverySlotDay): string => {
    if (locale !== "fa") return day.label;
    if (day.relativeDay === "today") return t("today");
    if (day.relativeDay === "tomorrow") return t("tomorrow");
    return faJalaliDate(day.date);
  };

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
      <ChipGroup
        aria-label={t("dayAria")}
        value={activeDay.date}
        onValueChange={setActiveDate}
        className="flex-nowrap overflow-x-auto"
      >
        {days.map((day) => (
          <Chip key={day.date} value={day.date} className="shrink-0">
            {dayLabel(day)}
          </Chip>
        ))}
      </ChipGroup>

      <div className="flex flex-col gap-2">
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
 * One bookable window, modelled as a native radio (the day's windows form one
 * keyboard-navigable group). Mirrors the payment-method option: the radio is
 * hidden, selection shown by the highlighted border, focus by the ring. A full
 * window is disabled and dimmed. Availability is only surfaced when it matters —
 * "Full" when booked out, an "Only N left" nudge when low (same scarcity cue as
 * the product cards), nothing when there's plenty.
 */
function SlotOption({ slot, selected, onSelect, disabled }: SlotOptionProps) {
  const t = useTranslations("checkout");
  const tSlots = useTranslations("checkout.slots");
  const locale = useLocale();
  const { availability } = slot;

  // Window name from the localized catalog (keyed by the stable window id, like the
  // payment-method labels); an unknown id falls back to the stored English name.
  const name = isSlotNameKey(slot.windowId) ? tSlots(slot.windowId) : slot.label;
  // English keeps the domain's range snapshot; `fa` re-derives a Persian-numeral 24h range.
  const timeRange = locale === "fa" ? (faWindowRange(slot.windowId) ?? slot.timeRange) : slot.timeRange;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-card-xl border bg-surface px-4 py-3 transition-colors",
        "has-focus-visible:ring-2 has-focus-visible:ring-ring",
        selected ? "border-foreground" : "border-transparent",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="flex flex-col gap-1">
        <span className="text-body-b6 text-foreground">{name}</span>
        <span className="text-body-b10 text-muted-foreground">{timeRange}</span>
      </span>

      <input
        type="radio"
        name="delivery-slot"
        value={slot.windowId}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />

      {availability.level === "full" ? (
        <span className="shrink-0 text-body-b10 text-destructive">{t("full")}</span>
      ) : availability.level === "low" ? (
        <span className="shrink-0 text-body-b10 text-warning-foreground">
          {t("slotOnlyLeft", { count: availability.remaining })}
        </span>
      ) : null}
    </label>
  );
}
