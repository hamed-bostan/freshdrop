import Image from "next/image";
import { useLocale } from "next-intl";
import type { Product } from "@/src/domain/entities/Product";
import { formatMoney } from "@/src/lib/formatMoney";

interface SearchSuggestionsProps {
  results: Product[];
  /** Invoked when a suggestion is chosen (keyboard or pointer). */
  onSelect: (product: Product) => void;
}

/**
 * Autocomplete panel floated under the search field. Each row is a button (not a
 * link) so selection routes through the parent `SearchBar`, which also closes the
 * panel. Mirrors the map's `PlaceSearchResults`.
 */
export function SearchSuggestions({ results, onSelect }: SearchSuggestionsProps) {
  const locale = useLocale();
  if (results.length === 0) return null;

  return (
    <ul className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-card-lg border border-border bg-popover py-1 shadow-lg">
      {results.map((product) => (
        <li key={product.id}>
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-muted-strong focus-visible:bg-muted-strong focus-visible:outline-none"
          >
            <Image
              src={product.imageUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 object-contain"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-b7 text-foreground">{product.name}</span>
              {product.unit && (
                <span className="block truncate text-body-b10 text-muted-foreground">{product.unit}</span>
              )}
            </span>
            <span className="shrink-0 text-body-b8 font-bold text-foreground">
              {formatMoney(product.price, locale)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
