"use client";

import { useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { DEFAULT_ANALYTICS_PRESET } from "@/src/domain/entities/Analytics";
import { Icon, Input, Select } from "@/src/presentation/design-system";

/**
 * The value the preset select carries when the period is an explicit from/to.
 * Exported so the screen can label the option without restating the string.
 */
export const CUSTOM_RANGE_VALUE = "custom";

type AnalyticsRangePickerProps = {
  /** Accessible name for the preset select. */
  presetLabel: string;
  /** Labels for each preset and for the custom option, resolved server-side. */
  presetOptions: { value: string; label: string }[];
  fromLabel: string;
  toLabel: string;
  /** The period actually in effect, as `YYYY-MM-DD` — the resolved range, not the raw params. */
  from: string;
  /** Inclusive last day of the period (the stored end is exclusive; see `toInclusiveEndParam`). */
  to: string;
  /** Whether the URL names an explicit period rather than a preset. */
  isCustom: boolean;
};

/**
 * The period control that drives the whole overview.
 *
 * Writes to the URL rather than to component state, the same rule the admin lists
 * follow: the period is a navigation, Next re-runs the server render, and every
 * tile, the chart and both rankings come back describing the new range together.
 * There is no client fetch and no possibility of one panel still showing the old
 * period while another has moved on.
 *
 * The two modes are exclusive by construction — choosing a preset clears `from`/`to`
 * and choosing dates clears `range` — so the URL can never carry a period that
 * disagrees with itself.
 *
 * The date inputs are populated from the *resolved* range rather than from the raw
 * params, so a preset shows the days it actually covers: switching from "30 days"
 * to "custom" starts from those thirty days instead of from an empty pair of boxes.
 */
export function AnalyticsRangePicker({
  presetLabel,
  presetOptions,
  fromLabel,
  toLabel,
  from,
  to,
  isCustom,
}: AnalyticsRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Navigate to the current route with a new query string. `replace`, so changing the period doesn't stack history. */
  function apply(next: URLSearchParams): void {
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function selectPreset(value: string): void {
    const next = new URLSearchParams(searchParams);
    if (value === CUSTOM_RANGE_VALUE) {
      // Seed the custom period with the one already on screen, so switching modes
      // doesn't blank the dashboard until both boxes are filled.
      next.delete("range");
      next.set("from", from);
      next.set("to", to);
    } else {
      next.delete("from");
      next.delete("to");
      next.set("range", value);
    }
    apply(next);
  }

  function setBound(name: "from" | "to", value: string): void {
    // An empty box means the user is mid-edit, not that they want a different
    // period — the server needs both bounds to honour a custom range anyway, and
    // navigating on the first cleared field would snap the page back to a preset.
    if (!value) return;

    const next = new URLSearchParams(searchParams);
    next.delete("range");
    next.set("from", name === "from" ? value : from);
    next.set("to", name === "to" ? value : to);
    apply(next);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative">
        <Icon
          icon={Calendar}
          size="xs"
          className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-icon-muted"
        />
        <Select
          size="sm"
          aria-label={presetLabel}
          value={isCustom ? CUSTOM_RANGE_VALUE : (searchParams.get("range") ?? DEFAULT_ANALYTICS_PRESET)}
          onChange={(event) => selectPreset(event.target.value)}
          className="w-auto ps-9"
        >
          {presetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {isCustom ? (
        <>
          <Input
            type="date"
            size="sm"
            aria-label={fromLabel}
            value={from}
            // Can't run past the other bound: an inverted range is silently
            // rejected server-side (it falls back to the default preset), and a
            // control that lets you build one is a control that lies about what
            // you'll get.
            max={to}
            onChange={(event) => setBound("from", event.target.value)}
            className="w-auto"
            inputClassName="px-3"
          />
          <Input
            type="date"
            size="sm"
            aria-label={toLabel}
            value={to}
            min={from}
            onChange={(event) => setBound("to", event.target.value)}
            className="w-auto"
            inputClassName="px-3"
          />
        </>
      ) : null}
    </div>
  );
}
