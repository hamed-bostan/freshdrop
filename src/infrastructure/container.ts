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
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";

import { PrismaCategoryRepository } from "./repositories/PrismaCategoryRepository";
import { PrismaProductRepository } from "./repositories/PrismaProductRepository";
import { PrismaUserRepository } from "./repositories/PrismaUserRepository";
import { MockFavoriteRepository } from "./repositories/mock/MockFavoriteRepository";
import { PrismaReviewRepository } from "./repositories/PrismaReviewRepository";
import { PrismaDeliveryLocationRepository } from "./repositories/PrismaDeliveryLocationRepository";
import { PrismaPaymentMethodRepository } from "./repositories/PrismaPaymentMethodRepository";
import { PrismaDeliveryOptionRepository } from "./repositories/PrismaDeliveryOptionRepository";
import { PrismaWalletRepository } from "./repositories/PrismaWalletRepository";
import { PrismaOrderRepository } from "./repositories/PrismaOrderRepository";
import { MockOrderTrackingRepository } from "./repositories/mock/MockOrderTrackingRepository";
import { PrismaCartRepository } from "./repositories/PrismaCartRepository";
import { PrismaPromoCodeRepository } from "./repositories/PrismaPromoCodeRepository";
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
// Categories and products are real data now — PostgreSQL via Prisma (server-side
// only). The mock catalog lives on in the seed migration that backfilled the table.
export const categoryRepository: ICategoryRepository = new PrismaCategoryRepository();
export const productRepository: IProductRepository = new PrismaProductRepository();
// Users are real data — PostgreSQL via Prisma. Rows are created on first sign-in
// (auth `authorize` → GetOrCreateUser) and edited via the profile feature.
export const userRepository: IUserRepository = new PrismaUserRepository();
export const favoriteRepository: IFavoriteRepository = new MockFavoriteRepository(productRepository);
// Reviews are real data now — PostgreSQL via Prisma. The demo reviews live on in
// the seed migration that backfilled the table; new reviews are written by
// signed-in users from the product screen.
export const reviewRepository: IReviewRepository = new PrismaReviewRepository();
// Addresses are real data now — PostgreSQL via Prisma. Per-user: real users start
// with none and add them via the "Add New Address" flow; the demo addresses live on
// in the seed migration, owned by the sentinel `demo` user.
export const deliveryLocationRepository: IDeliveryLocationRepository = new PrismaDeliveryLocationRepository();
// Payment options are real data now — PostgreSQL via Prisma. The fixed catalog
// (Cash, Wallet, PayPal, Apple/Google Pay) lives on in the seed migration that
// backfilled the table; it's reference data, like promo codes.
export const paymentMethodRepository: IPaymentMethodRepository = new PrismaPaymentMethodRepository();
// Delivery options are real data now — PostgreSQL via Prisma. The fixed catalog
// (Fast, Standard) lives on in the seed migration that backfilled the table; it's
// reference data, like payment methods.
export const deliveryOptionRepository: IDeliveryOptionRepository = new PrismaDeliveryOptionRepository();
// Wallets are real data now — PostgreSQL via Prisma. Balance, saved cards and
// transactions are per-user; real users start empty and fill the wallet via the
// "Add Money" / "Add Card" flows. The demo wallet lives on in the seed migration.
export const walletRepository: IWalletRepository = new PrismaWalletRepository();
// Orders are real data now — PostgreSQL via Prisma. The demo order history lives
// on in the seed migration that backfilled the table; orders advance through
// delivery stages from the dashboard.
export const orderRepository: IOrderRepository = new PrismaOrderRepository();
// Tracking composes the real order (its persisted stage drives the stepper) with
// a still-stubbed courier feed: the map destination/courier point/route and the
// rider remain static placeholders until a realtime routing provider is wired in.
export const orderTrackingRepository: IOrderTrackingRepository = new MockOrderTrackingRepository(orderRepository);
// Carts and promo codes are real data now — PostgreSQL via Prisma. The cart is
// per-user (one `cart_items` row per user+product); the demo cart and the promo
// catalog live on in the seed migration that backfilled the tables.
export const cartRepository: ICartRepository = new PrismaCartRepository(productRepository);
export const promoCodeRepository: IPromoCodeRepository = new PrismaPromoCodeRepository();

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
