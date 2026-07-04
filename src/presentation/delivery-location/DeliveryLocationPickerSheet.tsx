"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent, Button } from "@/src/presentation/design-system";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { deliveryLocationsApi } from "./delivery-location-api";
import { DeliveryLocationItem } from "./components/DeliveryLocationItem";

// The saved-address routes this sheet links out to: the picker for a new address, and
// a given address's edit page. Adding an address needs the full form + map picker, so
// it's a navigation out of the sheet rather than an in-sheet action.
const ADD_LOCATION_ROUTE = "/profile/addresses/new";
const editRoute = (id: string): string => `/profile/addresses/${id}/edit`;

/** The selected address is the user's default; fall back to the first if none is flagged. */
function selectedLocationId(locations: DeliveryLocation[]): string | undefined {
  return (locations.find((location) => location.isDefault) ?? locations[0])?.id;
}

interface DeliveryLocationPickerSheetProps {
  locations: DeliveryLocation[];
  /**
   * The element that opens the sheet, rendered via `asChild` so the caller controls
   * its look (the home header's region label, checkout's "Change" link, …).
   */
  trigger: React.ReactNode;
}

/**
 * Bottom-sheet address picker: selecting an address persists it as the user's checkout
 * default (`setDefault`) and re-renders the server tree so every surface — the home
 * header, Manage Address and checkout — reflects the choice. Selection happens in
 * context (no navigation), so a caller like checkout keeps its in-progress state.
 */
export function DeliveryLocationPickerSheet({ locations, trigger }: DeliveryLocationPickerSheetProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  // Optimistic highlight: track the picked id locally for instant feedback, but keep
  // it in step with the server's default after each refresh (the source of truth).
  const serverSelectedId = selectedLocationId(locations);
  const [selectedId, setSelectedId] = React.useState(serverSelectedId);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    setSelectedId(serverSelectedId);
  }, [serverSelectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id); // instant highlight
    setOpen(false); // close the sheet on choice
    startTransition(async () => {
      try {
        await deliveryLocationsApi.setDefault(id);
        // Persisted — re-render the server tree so checkout and Manage Address pick
        // up the new default instead of the pre-select snapshot. A refresh (not a
        // navigation) keeps any client state on the calling screen intact.
        router.refresh();
      } catch {
        // Didn't persist; snap the highlight back to the server's current default.
        setSelectedId(serverSelectedId);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent
        title="Select Your Delivery Location"
        description="Choose which saved address your order should be delivered to."
      >
        <ul className="flex flex-col gap-2">
          {locations.map((location) => (
            <li key={location.id}>
              <DeliveryLocationItem
                location={location}
                selected={location.id === selectedId}
                onSelect={() => handleSelect(location.id)}
                editHref={editRoute(location.id)}
              />
            </li>
          ))}
        </ul>

        <Button asChild variant="link" className="mt-8 text-button-btn4 mx-auto">
          <Link href={ADD_LOCATION_ROUTE}>add new location</Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
