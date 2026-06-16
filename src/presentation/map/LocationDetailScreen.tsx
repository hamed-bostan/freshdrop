"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button, TextField, Textarea } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import type { GeoPoint } from "@/src/domain/entities/Place";
import type { DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: persist via an AddDeliveryLocation use-case (address, detailAddress,
    // phone, label, center), then return to the list. For now, just navigate back.
    router.push("/profile/addresses");
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

      <Button type="submit" size="lg" className="mt-auto w-full">
        Add new location
      </Button>
    </form>
  );
}
