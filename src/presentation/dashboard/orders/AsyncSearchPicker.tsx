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
 * Implements the WAI-ARIA combobox pattern rather than a box-plus-clickable-list,
 * because the rest of this app's controls are Radix and clear that bar, and a
 * hand-rolled picker that a keyboard user can't arrow through would be the one
 * that doesn't. Focus stays in the input; a *virtual* cursor
 * (`aria-activedescendant`) moves over the options under the arrow keys, Enter
 * commits it, Escape closes. Radix Popover is used only to position the listbox —
 * focus never enters it, so its own key handling stays out of the way.
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
  // The virtually-focused option, or -1 for none. Kept as an index rather than an
  // id so arrow keys are a clamp on one number.
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const listId = React.useId();
  const optionId = (index: number): string => `${listId}-option-${index}`;

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
        if (current === generation.current) {
          setResults(found);
          // The cursor resets to "none" on each new result set — a held-over index
          // would point at a different item than the one it pointed at when set.
          setActiveIndex(-1);
        }
      } catch {
        // A failed lookup reads as "no matches" rather than an error state: the
        // box is one control in a form, and a red banner from a background fetch
        // nobody triggered on purpose would be noise. The empty label covers it.
        if (current === generation.current) {
          setResults([]);
          setActiveIndex(-1);
        }
      } finally {
        if (current === generation.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, search, minChars]);

  const term = query.trim();
  const showPanel = open && term.length >= minChars;
  const options = results ?? [];

  function choose(item: T): void {
    onSelect(item);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (!showPanel || options.length === 0) {
      // Arrowing an unopened box opens it, so the first Down doesn't feel dead.
      if (event.key === "ArrowDown" && term.length >= minChars) setOpen(true);
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
        break;
      case "Enter":
        // Only when a cursor is on an option — otherwise Enter is the form's to
        // handle, and stealing it would submit-block a picker the user is done with.
        if (activeIndex >= 0 && activeIndex < options.length) {
          event.preventDefault();
          choose(options[activeIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
    }
  }

  return (
    <Popover open={showPanel} onOpenChange={setOpen}>
      <PopoverAnchor>
        <Input
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          // The browser's own search-clear affordance would compete with the
          // component's; a plain text input keeps one clear model.
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          leftElement={<Search aria-hidden className="size-4 text-icon-muted" />}
          rightElement={loading ? <Spinner size="sm" /> : undefined}
        />
      </PopoverAnchor>

      <PopoverContent
        // Keep focus in the input so typing continues and the virtual cursor stays
        // meaningful — Radix would otherwise move real focus into the panel.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        {term.length < minChars ? (
          <p className="px-2 py-3 text-body-b6 text-muted-foreground">{hintLabel}</p>
        ) : options.length > 0 ? (
          <ul id={listId} role="listbox" aria-label={label} className="flex flex-col">
            {options.map((item, index) => {
              const active = index === activeIndex;
              return (
                <li
                  key={keyOf(item)}
                  id={optionId(index)}
                  role="option"
                  aria-selected={active}
                  // Keep the virtually-focused option visible when the list is
                  // taller than the panel — the arrow keys move a cursor the eye
                  // has to be able to follow.
                  ref={active ? (node) => node?.scrollIntoView({ block: "nearest" }) : undefined}
                  // Pointer only: keyboard commits through the input's Enter, so
                  // this is a mousedown-to-pick that also syncs the virtual cursor
                  // to what the pointer is over. `onMouseDown` (not click) fires
                  // before the input's blur, so the pick isn't lost to the popover
                  // closing first.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(item);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-button px-2 py-2 transition-colors",
                    active && "bg-accent",
                  )}
                >
                  {renderItem(item)}
                </li>
              );
            })}
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
