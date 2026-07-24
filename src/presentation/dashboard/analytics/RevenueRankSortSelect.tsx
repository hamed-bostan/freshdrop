"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import type { RevenueRankSort } from "@/src/domain/entities/Analytics";
import { Select } from "@/src/presentation/design-system";

type RevenueRankSortSelectProps = {
  /** The query param this control owns — distinct per panel, so products and categories sort independently. */
  paramName: string;
  value: RevenueRankSort;
  /** Omitted from the URL rather than written explicitly, so an untouched panel keeps a clean link. */
  defaultValue: RevenueRankSort;
  label: string;
  options: { value: RevenueRankSort; label: string }[];
};

/**
 * A ranked panel's own sort control — writes to the URL rather than component
 * state, the same rule {@link AnalyticsRangePicker} follows for the period above
 * it: changing it is a navigation, Next re-runs the server render, and the panel
 * comes back with rows the database already ordered the way the reader asked —
 * no client-side re-sort of a list that would otherwise silently disagree with
 * what a page reload shows.
 */
export function RevenueRankSortSelect({
  paramName,
  value,
  defaultValue,
  label,
  options,
}: RevenueRankSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(next: string): void {
    const params = new URLSearchParams(searchParams);
    if (next === defaultValue) params.delete(paramName);
    else params.set(paramName, next);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Select
      size="sm"
      aria-label={label}
      value={value}
      onChange={(event) => apply(event.target.value)}
      className="w-auto"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
