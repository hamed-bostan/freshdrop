import { MapPin } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import type { Place } from "@/src/domain/entities/Place";

interface PlaceSearchResultsProps {
  results: Place[];
  onSelect: (place: Place) => void;
}

export function PlaceSearchResults({ results, onSelect }: PlaceSearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <ul className="absolute inset-x-4 top-full z-[1100] mt-2 max-h-72 overflow-auto rounded-card-lg border border-border bg-popover py-1 shadow-lg">
      {results.map((place) => (
        <li key={place.id}>
          <button
            type="button"
            onClick={() => onSelect(place)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted-strong focus-visible:bg-muted-strong focus-visible:outline-none"
          >
            <Icon icon={MapPin} size="sm" className="mt-0.5 shrink-0 text-icon-muted" />
            <span className="min-w-0">
              <span className="block text-body-b7 text-foreground">{place.name}</span>
              <span className="block truncate text-body-b10 text-muted-foreground">{place.address}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
