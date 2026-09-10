"use client";

import { useRef } from "react";

import { Select } from "@/src/presentation/design-system";

import { useListParams } from "./useListParams";

export type ListFilterOption = {
  /** Query-param value; the empty string is the "no filter" option. */
  value: string;
  label: string;
};

type ListFilterSelectProps = {
  /** Query param this filter writes to, e.g. `categoryId` or `stock`. */
  paramName: string;
  /** Accessible name — filters sit in a toolbar with no visible labels. */
  label: string;
  options: ListFilterOption[];
  className?: string;
};

/**
 * A dropdown filter bound to one query param. Selecting an option navigates,
 * re-running the server render, and resets to page 1 (see `setFilter`).
 *
 * The empty-string option clears the filter rather than writing `?stock=` — the
 * parsers drop blank values, but a URL that carries dead params is harder to read
 * and to share.
 */
export function ListFilterSelect({ paramName, label, options, className }: ListFilterSelectProps) {
  const { searchParams, setFilter } = useListParams();
  const isPointerSelection = useRef(false);

  return (
    <Select
      size="sm"
      aria-label={label}
      value={searchParams.get(paramName) ?? ""}
      onPointerDown={() => { isPointerSelection.current = true; }}
      onKeyDown={() => { isPointerSelection.current = false; }}
      onChange={(event) => {
        setFilter(paramName, event.target.value || null);
        // Native selects can keep `:focus-visible` after their pointer-opened
        // menu closes. Clear that transient ring for pointer users, but retain
        // focus when the selection was made by keyboard so navigation can continue.
        if (isPointerSelection.current) event.currentTarget.blur();
        isPointerSelection.current = false;
      }}
      className={className ?? "w-auto"}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
