import * as React from "react";
import { useLocale } from "next-intl";
import type { Place } from "@/src/domain/entities/Place";
import { searchPlaces } from "../lib/geocoding-client";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

/**
 * Debounced forward-geocoding for a free-text query. Cancels the previous
 * request whenever the query changes, so only the latest result set wins.
 */
export function usePlaceSearch(query: string) {
  const locale = useLocale();
  const [results, setResults] = React.useState<Place[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        setResults(await searchPlaces(trimmed, locale, controller.signal));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  const clear = React.useCallback(() => setResults([]), []);

  return { results, isLoading, clear };
}
