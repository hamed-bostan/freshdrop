import * as React from "react";
import type { Product } from "@/src/domain/entities/Product";
import { productSearchApi } from "../product-search-api";

/** Below this many characters the query is treated as empty — no request, no suggestions. */
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/**
 * Debounced product typeahead for a free-text query. Cancels the previous request
 * whenever the query changes, so only the latest result set wins. Mirrors the
 * map's `usePlaceSearch`.
 */
export function useProductSearch(query: string) {
  const [results, setResults] = React.useState<Product[]>([]);
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
        setResults(await productSearchApi.search(trimmed, controller.signal));
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
  }, [query]);

  return { results, isLoading };
}
