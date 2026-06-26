import type { ICategoryRepository } from "@/src/domain/repositories/ICategoryRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { IFavoriteRepository } from "@/src/domain/repositories/IFavoriteRepository";
import type { IReviewRepository } from "@/src/domain/repositories/IReviewRepository";
import type { IDeliveryLocationRepository } from "@/src/domain/repositories/IDeliveryLocationRepository";
import type { IPaymentMethodRepository } from "@/src/domain/repositories/IPaymentMethodRepository";
import type { IDeliveryOptionRepository } from "@/src/domain/repositories/IDeliveryOptionRepository";
import type { IGeocodingRepository } from "@/src/domain/repositories/IGeocodingRepository";
import type { IWalletRepository } from "@/src/domain/repositories/IWalletRepository";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IOrderTrackingRepository } from "@/src/domain/repositories/IOrderTrackingRepository";
import type { ICartRepository } from "@/src/domain/repositories/ICartRepository";
import type { IPromoCodeRepository } from "@/src/domain/repositories/IPromoCodeRepository";
import type { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import type { IImageStorageRepository } from "@/src/domain/repositories/IImageStorageRepository";

import { PrismaCategoryRepository } from "./repositories/PrismaCategoryRepository";
import { MockProductRepository } from "./repositories/mock/MockProductRepository";
import { MockFavoriteRepository } from "./repositories/mock/MockFavoriteRepository";
import { MockReviewRepository } from "./repositories/mock/MockReviewRepository";
import { MockDeliveryLocationRepository } from "./repositories/mock/MockDeliveryLocationRepository";
import { MockPaymentMethodRepository } from "./repositories/mock/MockPaymentMethodRepository";
import { MockDeliveryOptionRepository } from "./repositories/mock/MockDeliveryOptionRepository";
import { MockWalletRepository } from "./repositories/mock/MockWalletRepository";
import { MockOrderRepository } from "./repositories/mock/MockOrderRepository";
import { MockOrderTrackingRepository } from "./repositories/mock/MockOrderTrackingRepository";
import { MockCartRepository } from "./repositories/mock/MockCartRepository";
import { MockPromoCodeRepository } from "./repositories/mock/MockPromoCodeRepository";
import { MockAuthRepository } from "./repositories/mock/MockAuthRepository";
import { SmsIrAuthRepository } from "./repositories/SmsIrAuthRepository";
import { NominatimGeocodingRepository } from "./repositories/NominatimGeocodingRepository";
import { SupabaseImageStorageRepository } from "./repositories/SupabaseImageStorageRepository";

const SMS_IR_DEFAULT_TEMPLATE_ID = 562447;

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
// Categories are real data now — PostgreSQL via Prisma (server-side only).
export const categoryRepository: ICategoryRepository = new PrismaCategoryRepository();
export const productRepository: IProductRepository = new MockProductRepository();
export const favoriteRepository: IFavoriteRepository = new MockFavoriteRepository(productRepository);
export const reviewRepository: IReviewRepository = new MockReviewRepository();
export const deliveryLocationRepository: IDeliveryLocationRepository = new MockDeliveryLocationRepository();
export const paymentMethodRepository: IPaymentMethodRepository = new MockPaymentMethodRepository();
export const deliveryOptionRepository: IDeliveryOptionRepository = new MockDeliveryOptionRepository();
export const walletRepository: IWalletRepository = new MockWalletRepository();
export const orderRepository: IOrderRepository = new MockOrderRepository(productRepository);
export const orderTrackingRepository: IOrderTrackingRepository = new MockOrderTrackingRepository(orderRepository);
export const cartRepository: ICartRepository = new MockCartRepository(productRepository);
export const promoCodeRepository: IPromoCodeRepository = new MockPromoCodeRepository();

// Real SMS OTP when an SMS.ir key is configured; the in-memory mock otherwise so
// local dev works without credentials (the mock surfaces the code in the UI).
export const authRepository: IAuthRepository = process.env.SMS_IR_API_KEY
  ? new SmsIrAuthRepository({
      apiKey: process.env.SMS_IR_API_KEY,
      templateId: Number(process.env.SMS_IR_TEMPLATE_ID ?? SMS_IR_DEFAULT_TEMPLATE_ID),
      baseUrl: process.env.SMS_IR_BASE_URL,
    })
  : new MockAuthRepository();

// Real provider (not a mock): Nominatim runs server-side only — the route
// handlers under `app/api/geocoding/*` are the only callers, which lets us send
// the required identifying `User-Agent` and keep the upstream off the client.
// Override the public OSM server / identity via env when self-hosting Nominatim.
export const geocodingRepository: IGeocodingRepository = new NominatimGeocodingRepository({
  baseUrl: process.env.NOMINATIM_BASE_URL,
  userAgent: process.env.NOMINATIM_USER_AGENT ?? "FreshDrop/0.1 (+https://example.com/contact)",
  language: process.env.NOMINATIM_LANGUAGE ?? "en",
});

// Supabase Storage for images. Server-side only — it holds the service-role key,
// so it must never be imported by client components (the public bucket means
// reads need no key anyway). `SUPABASE_URL` falls back to the public URL since
// they're the same origin.
export const imageStorageRepository: IImageStorageRepository = new SupabaseImageStorageRepository({
  url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SECRET_KEY!,
  bucket: process.env.SUPABASE_IMAGES_BUCKET ?? "images",
});
