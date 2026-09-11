"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import type { DeliveryLocation, DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import type { GeoPoint } from "@/src/domain/entities/Place";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { deliveryLocationsApi } from "@/src/presentation/delivery-location/delivery-location-api";
import { Button, FormMessage, Input, Skeleton, Textarea, TextField } from "@/src/presentation/design-system";

import { AddressLabelChips } from "./components";
import { useReverseGeocodedPlace } from "./hooks/use-reverse-geocode";
import { reverseGeocode } from "./lib/geocoding-client";

// Leaflet is client-only; load the maps lazily and keep them out of the SSR bundle.
const LocationPreviewMap = dynamic(
  () => import("./components/LocationPreviewMap").then((mod) => mod.LocationPreviewMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

const LocationRepinMap = dynamic(
  () => import("./components/LocationRepinMap").then((mod) => mod.LocationRepinMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
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
  /** Reverse-geocoded city for the chosen coordinate, seeding the City field (add flow). */
  initialCity?: string;
}

export default function LocationDetailScreen({
  center,
  location,
  initialAddress,
  initialCity,
}: LocationDetailScreenProps) {
  const t = useTranslations("addresses");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
  const router = useRouter();

  const isEditing = location !== undefined;

  // Editing: prefilled from the saved address. Adding: seeded with the picked
  // location's reverse-geocoded address, which the user can refine.
  const [address, setAddress] = React.useState(location?.address ?? initialAddress ?? "");
  const [city, setCity] = React.useState(location?.city ?? initialCity ?? "");
  const [label, setLabel] = React.useState<DeliveryLocationKind>(location?.kind ?? "home");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // The live coordinate under the pin. `null` until the user actually pans the edit
  // map, so the saved coordinate/address stay untouched on first paint. The submitted
  // coordinate is the panned point when present, else the one we opened at.
  const [point, setPoint] = React.useState<GeoPoint | null>(null);
  const coordinate = point ?? center;

  // Whether the user has hand-edited the Address / City field since the last pan. A
  // manual edit wins over the pin's reverse-geocoded values (both the live sync below
  // and the confirmed-coordinate resolve on submit), so a refined value isn't clobbered.
  const addressEditedRef = React.useRef(false);
  const cityEditedRef = React.useRef(false);

  const handleCenterChange = (next: GeoPoint) => {
    // Ignore the map's initial settling report (~the opening centre) so it doesn't
    // count as a move; only a genuine pan updates the pin.
    if (isSamePoint(next, center)) return;
    // A fresh pan re-adopts the reverse-geocoded address and city for the new spot.
    addressEditedRef.current = false;
    cityEditedRef.current = false;
    setPoint(next);
  };

  // Keep the Address and City fields in lockstep with the pin: once the user pans,
  // reverse-geocode the new coordinate (debounced) and adopt its values. `point` is
  // null until the first pan, so the saved values are preserved until then; typing
  // after a pan is preserved until the next pan.
  const pinnedPlace = useReverseGeocodedPlace(point, null);
  React.useEffect(() => {
    if (!pinnedPlace) return;
    if (pinnedPlace.address && !addressEditedRef.current) setAddress(pinnedPlace.address);
    if (pinnedPlace.city && !cityEditedRef.current) setCity(pinnedPlace.city);
  }, [pinnedPlace]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!address.trim()) {
      setError(t("errEnterAddress"));
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        // Save the address/city for the *exact* pinned coordinate. When the pin has
        // been moved and the user hasn't hand-edited a field, the live value is
        // debounced and can still trail the pin — most visibly if they hit Save right
        // after panning — so resolve the confirmed coordinate here (cached, usually
        // instant) to keep the coordinate and its values in lockstep. A manual edit wins.
        let resolvedAddress = address.trim();
        let resolvedCity = city.trim();
        const needsResolve =
          point && (!addressEditedRef.current || !cityEditedRef.current);
        if (needsResolve) {
          try {
            const place = await reverseGeocode(coordinate, locale);
            if (place?.address && !addressEditedRef.current) resolvedAddress = place.address;
            if (place?.city && !cityEditedRef.current) resolvedCity = place.city;
          } catch {
            // Lookup failed — keep the field values rather than blanking them.
          }
        }

        const input = {
          address: resolvedAddress,
          city: resolvedCity || undefined,
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
          // 401 keeps the feature's own copy (a sign-in prompt beats the generic
          // "not authorized"); everything else resolves through the shared map.
          err instanceof ApiError && err.status === 401
            ? t("errSignIn")
            : localizeApiError(err, tApiErrors, t("errSave")),
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
        title={isEditing ? t("editTitle") : t("detailTitle")}
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

        <TextField label={t("cityLabel")}>
          {(control) => (
              <Input
                  {...control}
                  placeholder={t("cityPlaceholder")}
                  value={city}
                  onChange={(event) => {
                    cityEditedRef.current = true;
                    setCity(event.target.value);
                  }}
              />
          )}
        </TextField>

        <TextField label={t("addressLabel")}>
          {(control) => (
            <Textarea
              {...control}
              rows={5}
              placeholder={t("addressPlaceholder")}
              value={address}
              onChange={(event) => {
                addressEditedRef.current = true;
                setAddress(event.target.value);
              }}
            />
          )}
        </TextField>

        <div className="flex flex-col gap-2">
          <span className="text-body-b2 text-muted-foreground">{t("saveAs")}</span>
          <AddressLabelChips value={label} onChange={setLabel} onAddCustom={handleAddCustomLabel} />
        </div>
      </div>

      {error && (
        <FormMessage size="md" className="text-center">{error}</FormMessage>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-auto w-full">
        {pending ? t("saving") : isEditing ? t("saveChanges") : t("addNewLocationBtn")}
      </Button>
    </form>
  );
}
