import * as React from "react";

/**
 * `useState` whose value is mirrored to `sessionStorage`, so a selection survives
 * navigating away and back (and a reload) within the same tab session — but not
 * across tabs, and not once the tab closes. Meant for ephemeral, in-progress UI
 * state (e.g. an unsubmitted checkout), never for anything the server owns.
 *
 * SSR-safe: the first render always uses `defaultValue` (so it matches the server
 * HTML); the stored value is read in an effect after mount, costing at most one
 * extra render. Writes happen *only* through the returned setter — never in an
 * effect — so the on-mount hydration can't be clobbered by a default-value write
 * (the usual race when persistence is done with a second effect).
 *
 * @param key          sessionStorage key. Changing it re-hydrates from the new slot.
 * @param defaultValue value before hydration and when nothing is stored.
 * @param revive       optional validator for the parsed stored value — return a
 *                     sanitized value, or `defaultValue` to reject stale/invalid data.
 */
export function useSessionStorageState<T>(
  key: string,
  defaultValue: T,
  revive?: (stored: T) => T,
): readonly [T, (action: React.SetStateAction<T>) => void, () => void] {
  const [value, setValue] = React.useState<T>(defaultValue);

  // Keep the latest reviver in a ref so hydration can call it without listing it as
  // a dependency (it runs once per key, using whatever validator is current then).
  const reviveRef = React.useRef(revive);
  React.useEffect(() => {
    reviveRef.current = revive;
  });

  React.useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        setValue(reviveRef.current ? reviveRef.current(parsed) : parsed);
      }
    } catch {
      // Malformed or unavailable storage — keep the default.
    }
  }, [key]);

  const set = React.useCallback(
    (action: React.SetStateAction<T>) => {
      setValue((prev) => {
        const next = typeof action === "function" ? (action as (prev: T) => T)(prev) : action;
        try {
          window.sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Quota exceeded or storage unavailable — the in-memory value still updates.
        }
        return next;
      });
    },
    [key],
  );

  const clear = React.useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }, [key]);

  return [value, set, clear] as const;
}
