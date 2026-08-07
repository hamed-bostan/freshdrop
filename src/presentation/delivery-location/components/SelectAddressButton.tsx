"use client";

import * as React from "react";

import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { useRouter } from "@/src/i18n/navigation";

import { deliveryLocationsApi } from "../delivery-location-api";

import { DeliveryLocationSummary } from "./DeliveryLocationSummary";

type SelectAddressButtonProps = {
  location: DeliveryLocation;
};

/**
 * The tappable body of an address card on the Manage Address screen: selecting it
 * makes the address the user's checkout default over the API, then re-renders the
 * server tree so the new selection is reflected here and at checkout. Selecting the
 * already-selected address is a no-op. The selected visual (border) lives on the
 * card, driven by `location.isDefault` from the server.
 */
export function SelectAddressButton({ location }: SelectAddressButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const handleSelect = (): void => {
    if (location.isDefault) return;
    startTransition(async () => {
      try {
        await deliveryLocationsApi.setDefault(location.id);
        router.refresh();
      } catch {
        // The server render stays the source of truth; a failed select just doesn't
        // move the highlight.
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={pending}
      aria-pressed={location.isDefault}
      className="flex min-w-0 flex-1 items-center text-start disabled:opacity-70"
    >
      <DeliveryLocationSummary location={location} />
    </button>
  );
}
