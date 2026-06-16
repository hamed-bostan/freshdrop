import type { ICategoryRepository } from "@/src/domain/repositories/ICategoryRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { IDeliveryLocationRepository } from "@/src/domain/repositories/IDeliveryLocationRepository";
import type { IPaymentMethodRepository } from "@/src/domain/repositories/IPaymentMethodRepository";
import type { IGeocodingRepository } from "@/src/domain/repositories/IGeocodingRepository";
import type { IWalletRepository } from "@/src/domain/repositories/IWalletRepository";

import { MockCategoryRepository } from "./repositories/mock/MockCategoryRepository";
import { MockProductRepository } from "./repositories/mock/MockProductRepository";
import { MockDeliveryLocationRepository } from "./repositories/mock/MockDeliveryLocationRepository";
import { MockPaymentMethodRepository } from "./repositories/mock/MockPaymentMethodRepository";
import { MockWalletRepository } from "./repositories/mock/MockWalletRepository";
import { NominatimGeocodingRepository } from "./repositories/NominatimGeocodingRepository";

/**
 * Composition root.
 *
 * The single place that binds domain repository *interfaces* to concrete
 * *implementations*. This is the only module that imports concrete repositories;
 * everything else (use-cases, pages) depends on the interfaces — Dependency
 * Inversion in practice.
 *
 * To move from mock data to a real API, swap the right-hand side here, e.g.
 *   export const categoryRepository: ICategoryRepository =
 *     new CategoryRepository(process.env.API_BASE_URL!);
 * and nothing else in the app changes.
 */
export const categoryRepository: ICategoryRepository = new MockCategoryRepository();
export const productRepository: IProductRepository = new MockProductRepository();
export const deliveryLocationRepository: IDeliveryLocationRepository = new MockDeliveryLocationRepository();
export const paymentMethodRepository: IPaymentMethodRepository = new MockPaymentMethodRepository();
export const walletRepository: IWalletRepository = new MockWalletRepository();

// Real provider (not a mock): Nominatim runs server-side only — the route
// handlers under `app/api/geocoding/*` are the only callers, which lets us send
// the required identifying `User-Agent` and keep the upstream off the client.
// Override the public OSM server / identity via env when self-hosting Nominatim.
export const geocodingRepository: IGeocodingRepository = new NominatimGeocodingRepository({
  baseUrl: process.env.NOMINATIM_BASE_URL,
  userAgent: process.env.NOMINATIM_USER_AGENT ?? "FreshDrop/0.1 (+https://example.com/contact)",
  language: process.env.NOMINATIM_LANGUAGE ?? "en",
});
