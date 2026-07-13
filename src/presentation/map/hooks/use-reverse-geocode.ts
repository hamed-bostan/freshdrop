import * as React from "react";
import { useLocale } from "next-intl";
import type { GeoPoint, Place } from "@/src/domain/entities/Place";
import { reverseGeocode } from "../lib/geocoding-client";

const DEBOUNCE_MS = 500;

/**
 * Resolves `point` to a `Place` (debounced), seeded with `initial` so the UI has
 * a label immediately on first paint. The previous resolved place is kept if a
 * lookup fails, so transient geocoder errors never blank the UI.
 */
export function useReverseGeocodedPlace(point: GeoPoint | null, initial: Place | null) {
  const locale = useLocale();
  const [place, setPlace] = React.useState<Place | null>(initial);

  React.useEffect(() => {
    if (!point) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const resolved = await reverseGeocode(point, locale, controller.signal);
        if (resolved) setPlace(resolved);
      } catch {
        // Keep the last known place on failure.
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Re-run when the coordinate actually changes (not every new object identity), or the locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.latitude, point?.longitude, locale]);

  return place;
}
