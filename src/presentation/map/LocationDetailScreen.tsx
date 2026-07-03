"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button, TextField, Textarea } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import type { GeoPoint } from "@/src/domain/entities/Place";
import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import { deliveryLocationsApi } from "@/src/presentation/delivery-location/delivery-location-api";
import { ApiError } from "@/src/lib/api/ApiError";
import { AddressLabelChips } from "./components";
import { useReverseGeocodedPlace } from "./hooks/use-reverse-geocode";
import { reverseGeocode } from "./lib/geocoding-client";

// Leaflet is client-only; load the maps lazily and keep them out of the SSR bundle.
const LocationPreviewMap = dynamic(
  () => import("./components/LocationPreviewMap").then((mod) => mod.LocationPreviewMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted-strong" />,
  },
);

const LocationRepinMap = dynamic(
  () => import("./components/LocationRepinMap").then((mod) => mod.LocationRepinMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted-strong" />,
  },
);

// Two coordinates that differ by less than this (in degrees, ~0.1m) are the "same"
// spot — used to ignore the map's initial settling report so a genuine pan is needed
// before we overwrite the saved address.
const SAME_POINT_EPSILON = 1e-6;

// The saved-address list: the parent that both the edit "back" control and a
// successful save return to. One constant so the two never drift apart.
const ADDRESSES_ROUTE = "/profile/addresses";

function isSamePoint(a: GeoPoint, b: GeoPoint): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < SAME_POINT_EPSILON &&
    Math.abs(a.longitude - b.longitude) < SAME_POINT_EPSILON
  );
}

interface LocationDetailScreenProps {
  /** The coordinate chosen on the map picker (add flow) or the saved address (edit flow). */
  center: GeoPoint;
  /** When present, the screen edits this saved address instead of creating a new one. */
  location?: DeliveryLocation;
  /**
   * Reverse-geocoded address for the chosen coordinate, used to seed the Address
   * field in the add flow so the picked location carries over instead of the user
   * retyping it. Ignored when editing (the saved address wins).
   */
  initialAddress?: string;
}

export default function LocationDetailScreen({ center, location, initialAddress }: LocationDetailScreenProps) {
  const router = useRouter();

  const isEditing = location !== undefined;

  // Editing: prefilled from the saved address. Adding: seeded with the picked
  // location's reverse-geocoded address, which the user can refine.
  const [address, setAddress] = React.useState(location?.address ?? initialAddress ?? "");
  const [label, setLabel] = React.useState<DeliveryLocationKind>(location?.kind ?? "home");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // The live coordinate under the pin. `null` until the user actually pans the edit
  // map, so the saved coordinate/address stay untouched on first paint. The submitted
  // coordinate is the panned point when present, else the one we opened at.
  const [point, setPoint] = React.useState<GeoPoint | null>(null);
  const coordinate = point ?? center;

  // Whether the user has hand-edited the Address field since the last pan. A manual
  // edit wins over the pin's reverse-geocoded address (both the live sync below and
  // the confirmed-coordinate resolve on submit), so a refined address isn't clobbered.
  const addressEditedRef = React.useRef(false);

  const handleCenterChange = (next: GeoPoint) => {
    // Ignore the map's initial settling report (~the opening centre) so it doesn't
    // count as a move; only a genuine pan updates the pin.
    if (isSamePoint(next, center)) return;
    // A fresh pan re-adopts the reverse-geocoded address for the new spot.
    addressEditedRef.current = false;
    setPoint(next);
  };

  // Keep the Address field in lockstep with the pin: once the user pans, reverse-
  // geocode the new coordinate (debounced) and adopt its address. `point` is null
  // until the first pan, so the saved address is preserved until then; typing after
  // a pan is preserved until the next pan.
  const pinnedPlace = useReverseGeocodedPlace(point, null);
  React.useEffect(() => {
    if (pinnedPlace?.address && !addressEditedRef.current) setAddress(pinnedPlace.address);
  }, [pinnedPlace]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!address.trim()) {
      setError("Enter an address.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        // Save the address for the *exact* pinned coordinate. When the pin has been
        // moved and the user hasn't hand-edited the field, the live value is debounced
        // and can still trail the pin — most visibly if they hit Save right after
        // panning — so resolve the confirmed coordinate here (cached, usually instant)
        // to keep the coordinate and its address in lockstep. A manual edit wins.
        let resolvedAddress = address.trim();
        if (point && !addressEditedRef.current) {
          try {
            const place = await reverseGeocode(coordinate);
            if (place?.address) resolvedAddress = place.address;
          } catch {
            // Lookup failed — keep the field value rather than blanking it.
          }
        }

        const input = {
          address: resolvedAddress,
          kind: label,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
        if (location) {
          await deliveryLocationsApi.update(location.id, input);
        } else {
          await deliveryLocationsApi.create(input);
        }
        // Saved — replace (not push) so the just-submitted form drops out of history:
        // "back" then returns to wherever the user entered from, never to a stale,
        // already-saved form. `refresh()` invalidates the Router Cache so the list
        // re-renders on the server with the change, not the pre-edit snapshot.
        router.replace(ADDRESSES_ROUTE);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof ApiError && err.status === 401
            ? "Please sign in to save an address."
            : err instanceof ApiError
              ? err.message
              : "Couldn't save your address. Please try again.",
        );
      }
    });
  };

  const handleAddCustomLabel = () => {
    // TODO: let the user enter a custom label (maps to DeliveryLocationKind "other").
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      {/* Editing is reached straight from the list, so back returns there (and on to
          Profile) as a clean hierarchy. Adding sits at the end of the picker → details
          flow, where a one-step history pop back to the picker is the natural "back". */}
      <PageHeader
        title={isEditing ? "Edit Address" : "Location Detail"}
        backHref={isEditing ? ADDRESSES_ROUTE : undefined}
      />

      {/* Editing: an interactive map to re-position the pin (and refresh the address).
          Adding: a read-only preview of the location already picked on the previous step. */}
      <div className={`${isEditing ? "h-56" : "h-44"} overflow-hidden rounded-card-xl`}>
        {isEditing ? (
          <LocationRepinMap initialCenter={center} onChange={handleCenterChange} />
        ) : (
          <LocationPreviewMap center={center} />
        )}
      </div>

      <div className="flex flex-col gap-5">
        <TextField label="Address">
          {(control) => (
            <Textarea
              {...control}
              rows={5}
              placeholder="Street, area, city…"
              value={address}
              onChange={(event) => {
                addressEditedRef.current = true;
                setAddress(event.target.value);
              }}
            />
          )}
        </TextField>

        <div className="flex flex-col gap-2">
          <span className="text-body-b2 text-muted-foreground">Save address as :</span>
          <AddressLabelChips value={label} onChange={setLabel} onAddCustom={handleAddCustomLabel} />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-center text-body-b8 text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-auto w-full">
        {pending ? "Saving…" : isEditing ? "Save changes" : "Add new location"}
      </Button>
    </form>
  );
}
