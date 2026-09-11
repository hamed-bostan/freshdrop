"use client";

import type { SortDirection } from "@/src/domain/entities/Pagination";
import { mergePageParams } from "@/src/lib/api/pagination-params";
import { Select } from "@/src/presentation/design-system";

import { useListParams } from "./useListParams";

export type ListSortOption<TSort extends string> = {
  sort: TSort;
  direction: SortDirection;
  label: string;
};

type ListSortSelectProps<TSort extends string> = {
  label: string;
  options: ListSortOption<TSort>[];
  /** The list's default ordering, so the default option leaves the URL clean. */
  defaultSort: TSort;
  defaultDirection: SortDirection;
};

/**
 * Ordering as a toolbar dropdown, for lists whose rows aren't a `<table>`.
 *
 * The orders list is a CSS grid because each row is a single link to its detail
 * route, which a `<tr>` can't be. That grid has no table semantics, so clickable
 * column headers there couldn't carry `aria-sort` honestly — the state would be
 * visible but unannounced. A labelled select says the same thing in a form
 * control that's correct on its own. Real `<table>` lists use
 * `ListSortHeader` instead, where the header cell can own `aria-sort` properly.
 *
 * Each option is a whole sort+direction pair rather than two controls, because
 * "newest first" is one idea to a reader, not a column plus a direction.
 */
export function ListSortSelect<TSort extends string>({
  label,
  options,
  defaultSort,
  defaultDirection,
}: ListSortSelectProps<TSort>) {
  const { searchParams, setParams } = useListParams();

  const activeSort = searchParams.get("sort") ?? defaultSort;
  const activeDirection = searchParams.get("dir") ?? defaultDirection;
  const activeValue = `${activeSort}:${activeDirection}`;

  function apply(value: string): void {
    const [sort, direction] = value.split(":") as [TSort, SortDirection];
    setParams(
      mergePageParams(
        searchParams,
        // Back to row 1: after re-ordering, the middle of the old sequence is an
        // arbitrary slice of the new one.
        { sort, direction, page: 1 },
        { sort: defaultSort, direction: defaultDirection },
      ),
    );
  }

  return (
    <Select
      size="sm"
      aria-label={label}
      value={activeValue}
      onChange={(event) => apply(event.target.value)}
      className="w-auto"
    >
      {options.map((option) => (
        <option key={`${option.sort}:${option.direction}`} value={`${option.sort}:${option.direction}`}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
