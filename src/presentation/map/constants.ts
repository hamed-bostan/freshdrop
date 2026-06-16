import type { GeoPoint } from "@/src/domain/entities/Place";

/** Where the picker opens before geolocation/search — downtown Toronto (Queen's Park). */
export const DEFAULT_CENTER: GeoPoint = { latitude: 43.6629, longitude: -79.3925 };

export const DEFAULT_ZOOM = 15;
/** Closer zoom used when recentering onto a searched result or the user's location. */
export const FOCUS_ZOOM = 16;

/**
 * An imperative "move the map here" instruction. The map is otherwise
 * uncontrolled (the user pans freely); bumping `version` is what triggers a
 * programmatic `setView`, so panning never fights with React state.
 */
export interface MapViewCommand {
  center: GeoPoint;
  zoom: number;
  version: number;
}
