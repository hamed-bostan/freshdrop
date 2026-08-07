"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { GitCompare } from "lucide-react";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import type { ComparisonMode } from "@/src/lib/api/analytics-params";
import { Button, Icon, Input, PopoverClose } from "@/src/presentation/design-system";
import { ListFilterPopover } from "@/src/presentation/dashboard/list";
import { cn } from "@/src/lib/utils";
import type { CompareOption } from "./compare-preview";

type AnalyticsComparePickerProps = {
  /** Which baseline the report is actually measured against right now. */
  mode: ComparisonMode;
  /** The trigger's own text, already formatted — "Compare: Jun 2 – Jul 1, 2026" or "No comparison". */
  triggerLabel: string;
  /** "Compare with" — the panel's heading and the radio group's accessible name. */
  heading: string;
  /** The four choices, in display order, each pre-labeled and pre-subtitled by the caller. */
  options: CompareOption[];
  fromLabel: string;
  toLabel: string;
  applyLabel: string;
  cancelLabel: string;
  /** The comparison baseline actually in effect, inclusive `YYYY-MM-DD` — seeds a switch to Custom when Custom is already the active mode. */
  activeFrom: string;
  activeTo: string;
  /** The "Previous period" baseline, inclusive `YYYY-MM-DD` — seeds a switch to Custom from any *other* mode, so its fields don't open empty. */
  previousPeriodFrom: string;
  previousPeriodTo: string;
};

/**
 * The "Compare" control beside a report's period picker — which baseline its
 * deltas and dashed comparison line are measured against.
 *
 * One trigger, not three: earlier this was a mode select plus a read-only pill
 * spelling out the resolved dates, which said the same thing twice and didn't
 * match how the picker's own reference design treats "which period" (a
 * calendar) and "compared against what" (a mode list) as two different
 * questions with two different open states. Here the trigger *is* the answer
 * ("Compare: Jun 2 – Jul 1, 2026"), and opening it is the only way to change it.
 *
 * Presentational only, the same rule `AnalyticsRangePicker` follows: every
 * string arrives pre-resolved from the caller's own `getTranslations` call
 * rather than this component reaching for `useTranslations` itself, so the
 * two pickers sitting side by side in a report's header stay one convention,
 * not two.
 */
export function AnalyticsComparePicker({
  mode,
  triggerLabel,
  heading,
  options,
  fromLabel,
  toLabel,
  applyLabel,
  cancelLabel,
  activeFrom,
  activeTo,
  previousPeriodFrom,
  previousPeriodTo,
}: AnalyticsComparePickerProps) {
  return (
    <ListFilterPopover label={triggerLabel} isActive={mode !== "none"} icon={<Icon icon={GitCompare} size="xs" />} contentClassName="w-72">
      <ComparePanel
        mode={mode}
        heading={heading}
        options={options}
        fromLabel={fromLabel}
        toLabel={toLabel}
        applyLabel={applyLabel}
        cancelLabel={cancelLabel}
        activeFrom={activeFrom}
        activeTo={activeTo}
        previousPeriodFrom={previousPeriodFrom}
        previousPeriodTo={previousPeriodTo}
      />
    </ListFilterPopover>
  );
}

type ComparePanelProps = Omit<AnalyticsComparePickerProps, "triggerLabel">;

/**
 * The draft: which mode, and (only for Custom) which two dates. Split out so it
 * lives *inside* the panel — Radix mounts popover content only while it's open,
 * so this is rebuilt from the current props every time it opens rather than
 * carrying stale state from the last time it was touched.
 */
function ComparePanel({
  mode,
  heading,
  options,
  fromLabel,
  toLabel,
  applyLabel,
  cancelLabel,
  activeFrom,
  activeTo,
  previousPeriodFrom,
  previousPeriodTo,
}: ComparePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [draftMode, setDraftMode] = React.useState<ComparisonMode>(mode);
  // Seeded from whatever baseline is already in effect, so switching to Custom
  // starts from real dates instead of an empty pair of boxes.
  const [draftFrom, setDraftFrom] = React.useState(mode === "custom" ? activeFrom : previousPeriodFrom);
  const [draftTo, setDraftTo] = React.useState(mode === "custom" ? activeTo : previousPeriodTo);

  function apply(): void {
    const next = new URLSearchParams(searchParams);
    if (draftMode === "previous") {
      next.delete("compare");
      next.delete("compareFrom");
      next.delete("compareTo");
    } else if (draftMode === "custom") {
      next.set("compare", "custom");
      next.set("compareFrom", draftFrom);
      next.set("compareTo", draftTo);
    } else {
      next.set("compare", draftMode);
      next.delete("compareFrom");
      next.delete("compareTo");
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-1 p-1">
      <p className="px-2 pb-1 text-body-b6 font-medium text-foreground">{heading}</p>

      <div role="radiogroup" aria-label={heading} className="flex flex-col">
        {options.map((option) => {
          const isSelected = draftMode === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-button px-2 py-2 transition-colors",
                isSelected ? "bg-accent" : "hover:bg-accent",
              )}
            >
              {/* A real radio group, not styled buttons: arrow-key navigation
                  between the options comes free and is what a keyboard user
                  expects of a one-of-many choice. */}
              <input
                type="radio"
                name="compareMode"
                className="sr-only"
                value={option.value}
                checked={isSelected}
                onChange={() => setDraftMode(option.value)}
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  isSelected ? "border-primary" : "border-border",
                )}
              >
                {isSelected ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>
              <span className="flex flex-col">
                <span className="text-body-b5 font-medium text-foreground">{option.label}</span>
                <span className="text-body-b10 text-muted-foreground">{option.subtitle}</span>
              </span>
            </label>
          );
        })}
      </div>

      {draftMode === "custom" ? (
        <div className="mt-1 flex flex-col gap-2 border-t border-border px-2 pt-2">
          <Input
            type="date"
            size="sm"
            aria-label={fromLabel}
            value={draftFrom}
            max={draftTo}
            onChange={(event) => setDraftFrom(event.target.value)}
          />
          <Input
            type="date"
            size="sm"
            aria-label={toLabel}
            value={draftTo}
            min={draftFrom}
            onChange={(event) => setDraftTo(event.target.value)}
          />
        </div>
      ) : null}

      <div className="mt-1 flex items-center justify-end gap-2 border-t border-border px-2 pt-2">
        <PopoverClose asChild>
          <Button variant="ghost" size="sm">
            {cancelLabel}
          </Button>
        </PopoverClose>
        <PopoverClose asChild>
          <Button size="sm" onClick={apply}>
            {applyLabel}
          </Button>
        </PopoverClose>
      </div>
    </div>
  );
}
