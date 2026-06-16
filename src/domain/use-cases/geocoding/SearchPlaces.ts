import type { Place } from "../../entities/Place";
import type { GeocodingSearchOptions, IGeocodingRepository } from "../../repositories/IGeocodingRepository";

export class SearchPlaces {
  constructor(private readonly geocodingRepo: IGeocodingRepository) {}

  execute(query: string, options?: GeocodingSearchOptions): Promise<Place[]> {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      throw new Error("SearchPlaces: query must not be empty.");
    }

    return this.geocodingRepo.search(trimmed, options);
  }
}
