"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button, TextField, Textarea } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import type { GeoPoint } from "@/src/domain/entities/Place";
import type { DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
import { deliveryLocationsApi } from "@/src/presentation/delivery-location/delivery-location-api";
import { ApiError } from "@/src/lib/api/ApiError";
import { AddressLabelChips } from "./components";

// Leaflet is client-only; load the preview lazily and keep it out of the SSR bundle.
const LocationPreviewMap = dynamic(
  () => import("./components/LocationPreviewMap").then((mod) => mod.LocationPreviewMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted-strong" />,
  },
);

interface LocationDetailScreenProps {
  /** The coordinate chosen on the map picker (previous step). */
  center: GeoPoint;
}

export default function LocationDetailScreen({ center }: LocationDetailScreenProps) {
  const router = useRouter();

  const [address, setAddress] = React.useState("");
  const [detailAddress, setDetailAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [label, setLabel] = React.useState<DeliveryLocationKind>("home");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!address.trim()) {
      setError("Enter an address.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await deliveryLocationsApi.create({
          address: address.trim(),
          detailAddress: detailAddress.trim(),
          phone: phone.trim(),
          kind: label,
          latitude: center.latitude,
          longitude: center.longitude,
        });
        // Saved — the list screen re-reads from the server on navigation.
        router.push("/profile/addresses");
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
      <PageHeader title="Location Detail" />

      <div className="h-44 overflow-hidden rounded-card-xl">
        <LocationPreviewMap center={center} />
      </div>

      <div className="flex flex-col gap-5">
        <TextField
          label="Address"
          size="lg"
          placeholder="block number..."
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />

        <TextField label="Detail Address">
          {(control) => (
            <Textarea
              {...control}
              rows={4}
              placeholder="block number..."
              value={detailAddress}
              onChange={(event) => setDetailAddress(event.target.value)}
            />
          )}
        </TextField>

        <TextField
          label="Phone number"
          size="lg"
          type="tel"
          inputMode="tel"
          placeholder="block number..."
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

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
        {pending ? "Saving…" : "Add new location"}
      </Button>
    </form>
  );
}
