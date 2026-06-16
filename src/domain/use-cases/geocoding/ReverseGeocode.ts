import { isValidGeoPoint, type GeoPoint, type Place } from "../../entities/Place";
import type { IGeocodingRepository } from "../../repositories/IGeocodingRepository";

export class ReverseGeocode {
  constructor(private readonly geocodingRepo: IGeocodingRepository) {}

  execute(point: GeoPoint): Promise<Place | null> {
    if (!isValidGeoPoint(point)) {
      throw new Error("ReverseGeocode: point is outside valid latitude/longitude ranges.");
    }

    return this.geocodingRepo.reverse(point);
  }
}
