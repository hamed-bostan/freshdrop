import * as React from "react";
import { adminSearchApi } from "./admin-search-api";
import type { AdminSearchResponse } from "./admin-search-response-schema";

const DEBOUNCE_MS = 200;

export type AdminSearchState = {
  response: AdminSearchResponse | null;
  isLoading: boolean;
  isError: boolean;
};

const IDLE: AdminSearchState = { response: null, isLoading: false, isError: false };

/**
 * Debounced admin global search for a free-text query. Cancels the previous
 * request whenever the query changes, so only the latest result set wins —
 * mirrors the storefront's `useProductSearch`.
 */
export function useAdminSearch(query: string): AdminSearchState {
  const [state, setState] = React.useState<AdminSearchState>(IDLE);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState(IDLE);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false }));
      try {
        const response = await adminSearchApi.search(trimmed, { signal: controller.signal });
        if (!controller.signal.aborted) setState({ response, isLoading: false, isError: false });
      } catch {
        if (!controller.signal.aborted) setState({ response: null, isLoading: false, isError: true });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return state;
}
