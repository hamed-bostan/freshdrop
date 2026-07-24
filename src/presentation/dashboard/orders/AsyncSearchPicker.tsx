"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input, Popover, PopoverAnchor, PopoverContent, Spinner } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

type AsyncSearchPickerProps<T> = {
  /** Accessible name for the search box. */
  label: string;
  placeholder: string;
  /** Runs the search. Should already be scoped to a small result count. */
  search: (query: string) => Promise<T[]>;
  /** Stable key for a result. */
  keyOf: (item: T) => string;
  /** How a result renders in the list. */
  renderItem: (item: T) => React.ReactNode;
  /** Called with the chosen result; the picker then clears its query. */
  onSelect: (item: T) => void;
  /** Shown under the box when a non-empty query returned nothing. */
  emptyLabel: string;
  /** Shown while a query is too short to search. */
  hintLabel?: string;
  /** Shortest query worth a request. Below this, nothing is fetched. */
  minChars?: number;
};

/**
 * Type-to-search, pick-one control for a form that isn't submitted yet — a
 * customer, a product to add to an order.
 *
 * A form-local island rather than a navigation: the whole point is that choosing
 * here doesn't throw away the rest of the order being built, which is exactly what
 * a URL-driven list would do. So it fetches over the browser client and holds its
 * results in local state, and it is one of the few places in this app that reads
 * data client-side on purpose.
 *
 * Debounced, and the debounce carries a generation token so a slow early request
 * can't land after a faster later one and overwrite it with stale matches — the
 * out-of-order-response bug every search-as-you-type has until it's fixed once.
 */
export function AsyncSearchPicker<T>({
  label,
  placeholder,
  search,
  keyOf,
  renderItem,
  onSelect,
  emptyLabel,
  hintLabel,
  minChars = 2,
}: AsyncSearchPickerProps<T>) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<T[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Bumped on every keystroke; a resolved request only applies if it's still the
  // latest, so responses that arrive out of order are dropped rather than shown.
  const generation = React.useRef(0);

  React.useEffect(() => {
    const term = query.trim();
    if (term.length < minChars) {
      setResults(null);
      setLoading(false);
      return;
    }

    const current = ++generation.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await search(term);
        if (current === generation.current) setResults(found);
      } catch {
        // A failed lookup reads as "no matches" rather than an error state: the
        // box is one control in a form, and a red banner from a background fetch
        // nobody triggered on purpose would be noise. The empty label covers it.
        if (current === generation.current) setResults([]);
      } finally {
        if (current === generation.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, search, minChars]);

  const term = query.trim();
  const showPanel = open && term.length >= minChars;

  return (
    <Popover open={showPanel} onOpenChange={setOpen}>
      <PopoverAnchor>
        <Input
          type="search"
          aria-label={label}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          leftElement={<Search aria-hidden className="size-4 text-icon-muted" />}
          rightElement={loading ? <Spinner size="sm" /> : undefined}
        />
      </PopoverAnchor>

      <PopoverContent
        // Keep focus in the input so typing continues while the list is open —
        // Radix would otherwise move focus into the panel on open.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        {term.length < minChars ? (
          <p className="px-2 py-3 text-body-b6 text-muted-foreground">{hintLabel}</p>
        ) : results && results.length > 0 ? (
          <ul className="flex flex-col">
            {results.map((item) => (
              <li key={keyOf(item)}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setQuery("");
                    setResults(null);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-button px-2 py-2 text-start transition-colors",
                    "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  )}
                >
                  {renderItem(item)}
                </button>
              </li>
            ))}
          </ul>
        ) : loading ? (
          <p className="px-2 py-3 text-body-b6 text-muted-foreground">…</p>
        ) : (
          <p className="px-2 py-3 text-body-b6 text-muted-foreground">{emptyLabel}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
