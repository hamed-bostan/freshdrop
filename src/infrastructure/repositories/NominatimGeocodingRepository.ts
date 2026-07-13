import type { GeoPoint, Place } from "@/src/domain/entities/Place";
import type {
  GeocodingOptions,
  GeocodingSearchOptions,
  IGeocodingRepository,
} from "@/src/domain/repositories/IGeocodingRepository";

/** Subset of the Nominatim `jsonv2` response we rely on. */
interface NominatimAddress {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
}

interface NominatimPlaceDto {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
  error?: string;
}

const DEFAULT_BASE_URL = "https://nominatim.openstreetmap.org";
// Geocoding results are stable; cache aggressively to stay within Nominatim's
// usage policy. Next's data cache keys on the full request URL.
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export interface NominatimConfig {
  /** Base URL of the Nominatim instance. Defaults to the public OSM server. */
  baseUrl?: string;
  /**
   * Identifying User-Agent. The public Nominatim usage policy *requires* a
   * value that identifies the application and a way to contact its operator.
   */
  userAgent: string;
  /** `Accept-Language` for localised display names. */
  language?: string;
}

/**
 * Geocoding backed by Nominatim (OpenStreetMap). Runs server-side only (it's
 * bound into route handlers via the container), which is what lets us attach the
 * required User-Agent, hide the upstream from the client, and cache responses.
 */
export class NominatimGeocodingRepository implements IGeocodingRepository {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly language: string;

  constructor(config: NominatimConfig) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.userAgent = config.userAgent;
    this.language = config.language ?? "en";
  }

  async search(query: string, options: GeocodingSearchOptions = {}): Promise<Place[]> {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(options.limit ?? 5),
      // In the query string (not just the header) so localised names actually vary
      // Next's URL-keyed data cache — a header alone would serve one language to all.
      "accept-language": options.language ?? this.language,
    });

    if (options.countryCodes?.length) {
      params.set("countrycodes", options.countryCodes.join(","));
    }

    const results = await this.request<NominatimPlaceDto[]>(`/search?${params.toString()}`);
    return results.map(toPlace);
  }

  async reverse(point: GeoPoint, options: GeocodingOptions = {}): Promise<Place | null> {
    const params = new URLSearchParams({
      lat: String(point.latitude),
      lon: String(point.longitude),
      format: "jsonv2",
      addressdetails: "1",
      "accept-language": options.language ?? this.language,
    });

    const result = await this.request<NominatimPlaceDto>(`/reverse?${params.toString()}`);
    // Nominatim signals "no match" with a `{ error }` body rather than an HTTP error.
    if (result.error) {
      return null;
    }

    return toPlace(result);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "User-Agent": this.userAgent,
      },
      next: { revalidate: CACHE_TTL_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

function toPlace(dto: NominatimPlaceDto): Place {
  const address = dto.address ?? {};
  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.state;
  const name = dto.name?.trim() || dto.display_name.split(",")[0]?.trim() || "Unknown location";

  return {
    id: String(dto.place_id),
    name,
    address: stripPostcode(dto.display_name, address.postcode),
    city,
    point: { latitude: Number(dto.lat), longitude: Number(dto.lon) },
  };
}

/**
 * Nominatim bakes the postcode into `display_name` (e.g. "…, Tehran Province,
 * 19578-34653, Iran"). Drop that one segment — it's structural, not something this
 * delivery UI shows, and it renders in Western digits which jars against the rest of
 * a Persian address. Matched against the structured `postcode`, so only that exact
 * segment is removed; anything else (including an absent postcode) is left untouched.
 */
function stripPostcode(displayName: string, postcode?: string): string {
  if (!postcode) return displayName;
  const target = postcode.trim();
  return displayName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== target)
    .join(", ");
}
