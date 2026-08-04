import type { ICategoryRepository } from "@/src/domain/repositories/ICategoryRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { IFavoriteRepository } from "@/src/domain/repositories/IFavoriteRepository";
import type { IReviewRepository } from "@/src/domain/repositories/IReviewRepository";
import type { IDeliveryLocationRepository } from "@/src/domain/repositories/IDeliveryLocationRepository";
import type { IPaymentMethodRepository } from "@/src/domain/repositories/IPaymentMethodRepository";
import type { IDeliverySlotRepository } from "@/src/domain/repositories/IDeliverySlotRepository";
import type { IGeocodingRepository } from "@/src/domain/repositories/IGeocodingRepository";
import type { IWalletRepository } from "@/src/domain/repositories/IWalletRepository";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IOrderNoteRepository } from "@/src/domain/repositories/IOrderNoteRepository";
import type { IOrderTrackingRepository } from "@/src/domain/repositories/IOrderTrackingRepository";
import type { ICartRepository } from "@/src/domain/repositories/ICartRepository";
import type { IStockAlertRepository } from "@/src/domain/repositories/IStockAlertRepository";
import type { IStockAlertNotifier } from "@/src/domain/repositories/IStockAlertNotifier";
import type { IOrderNotifier } from "@/src/domain/repositories/IOrderNotifier";
import type { INotificationChannel } from "@/src/domain/repositories/INotificationChannel";
import type { IPromoCodeRepository } from "@/src/domain/repositories/IPromoCodeRepository";
import type { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import type { IImageStorageRepository } from "@/src/domain/repositories/IImageStorageRepository";
import type { IUserRepository } from "@/src/domain/repositories/IUserRepository";
import type { IActivityLog } from "@/src/domain/repositories/IActivityLog";
import type { IAdminNotificationRepository } from "@/src/domain/repositories/IAdminNotificationRepository";
import type { IUnitOfWork } from "@/src/domain/repositories/IUnitOfWork";
import type { IAnalyticsRepository } from "@/src/domain/repositories/IAnalyticsRepository";
import type { IStockMovementLog } from "@/src/domain/repositories/IStockMovementLog";
import type { IEmailSender } from "@/src/domain/repositories/IEmailSender";
import type { ITeamNotifier } from "@/src/domain/repositories/ITeamNotifier";
import type { ITaxSettingsRepository } from "@/src/domain/repositories/ITaxSettingsRepository";
import type { IRefundRepository } from "@/src/domain/repositories/IRefundRepository";
import type { IOrderStatusEventLog } from "@/src/domain/repositories/IOrderStatusEventLog";
import type { INotificationTemplateRepository } from "@/src/domain/repositories/INotificationTemplateRepository";

import { PrismaCategoryRepository } from "./repositories/PrismaCategoryRepository";
import { PrismaProductRepository } from "./repositories/PrismaProductRepository";
import { PrismaUserRepository } from "./repositories/PrismaUserRepository";
import { PrismaActivityLog } from "./repositories/PrismaActivityLog";
import { PrismaAdminNotificationRepository } from "./repositories/PrismaAdminNotificationRepository";
import { PrismaUnitOfWork } from "./repositories/PrismaUnitOfWork";
import { PrismaStockMovementLog } from "./repositories/PrismaStockMovementLog";
import { PrismaAnalyticsRepository } from "./repositories/PrismaAnalyticsRepository";
import { MockFavoriteRepository } from "./repositories/mock/MockFavoriteRepository";
import { PrismaReviewRepository } from "./repositories/PrismaReviewRepository";
import { PrismaDeliveryLocationRepository } from "./repositories/PrismaDeliveryLocationRepository";
import { PrismaPaymentMethodRepository } from "./repositories/PrismaPaymentMethodRepository";
import { PrismaDeliverySlotRepository } from "./repositories/PrismaDeliverySlotRepository";
import { PrismaWalletRepository } from "./repositories/PrismaWalletRepository";
import { PrismaOrderRepository } from "./repositories/PrismaOrderRepository";
import { PrismaOrderNoteRepository } from "./repositories/PrismaOrderNoteRepository";
import { MockOrderTrackingRepository } from "./repositories/mock/MockOrderTrackingRepository";
import { PrismaCartRepository } from "./repositories/PrismaCartRepository";
import { PrismaStockAlertRepository } from "./repositories/PrismaStockAlertRepository";
import { LoggingStockAlertNotifier } from "./notifications/LoggingStockAlertNotifier";
import { OrderNotifier } from "./notifications/OrderNotifier";
import { LoggingNotificationChannel } from "./notifications/LoggingNotificationChannel";
import { SmsIrNotificationChannel } from "./notifications/SmsIrNotificationChannel";
import { TeamNotifier } from "./notifications/TeamNotifier";
import { LoggingEmailSender } from "./email/LoggingEmailSender";
import { SmtpEmailSender } from "./email/SmtpEmailSender";
import { PrismaPromoCodeRepository } from "./repositories/PrismaPromoCodeRepository";
import { MockAuthRepository } from "./repositories/mock/MockAuthRepository";
import { SmsIrAuthRepository } from "./repositories/SmsIrAuthRepository";
import { NominatimGeocodingRepository } from "./repositories/NominatimGeocodingRepository";
import { SupabaseImageStorageRepository } from "./repositories/SupabaseImageStorageRepository";
import { PrismaTaxSettingsRepository } from "./repositories/PrismaTaxSettingsRepository";
import { PrismaRefundRepository } from "./repositories/PrismaRefundRepository";
import { PrismaOrderStatusEventLog } from "./repositories/PrismaOrderStatusEventLog";
import { PrismaNotificationTemplateRepository } from "./repositories/PrismaNotificationTemplateRepository";

const SMS_IR_DEFAULT_TEMPLATE_ID = 562447;

/** Read a numeric env var, returning `undefined` when unset or not a number. */
function numericEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

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
// Append-only audit trail for every admin-visible change — catalog, orders,
// reviews, campaigns, stock and dashboard access alike. Real storage from the
// start (no logging stub): an audit trail that only existed in stdout would be
// worse than none, because it would read as one without being queryable.
//
// Read-only here: entries are written by the repositories that make the changes
// they describe, inside the same transaction, from a `NewActivityEntry` the
// use-case built. That split is what makes the log both unbypassable from the API
// (route handlers only call use-cases) and impossible to lose (the entry commits
// with its change). See `IActivityLog` and `AuditHook`.
export const activityLog: IActivityLog = new PrismaActivityLog();
// The bell's stored, per-admin notifications — a separate table from the log
// above, for the events it structurally can't hold (see `AdminNotification`).
// Best-effort by design, unlike the log: fanned out after the triggering
// write already committed, the same standing every outbound notifier here has.
export const adminNotificationRepository: IAdminNotificationRepository = new PrismaAdminNotificationRepository();
// Runs several repositories' writes as one transaction, for the operations that
// move an order, its stock and the customer's money together — cancellation,
// returns, and out-of-stock resolutions. Each of those was three transactions
// with two gaps in which the store could end up owing a refund it had no record
// of. See `IUnitOfWork`.
export const unitOfWork: IUnitOfWork = new PrismaUnitOfWork();
// Append-only ledger of every stock movement, real storage for the same reason the
// role log is: entries are written by `PrismaProductRepository` inside the same
// transaction as the quantity they explain, which a logging stub could not be.
export const stockMovementLog: IStockMovementLog = new PrismaStockMovementLog();
// Store aggregates — revenue, order mix, product and category rankings — computed
// in PostgreSQL rather than in the app. Not a data source of its own: it reads the
// same orders, items and catalog rows the repositories above write, so there is no
// second copy of the numbers to fall out of sync. See `IAnalyticsRepository` for
// why this is a port rather than more methods on `IOrderRepository`.
export const analyticsRepository: IAnalyticsRepository = new PrismaAnalyticsRepository();
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
// Delivery windows + their booking ledger — PostgreSQL via Prisma. The window
// catalog (Morning, Midday, …) is seeded reference data, like payment methods; the
// ledger enforces per-slot capacity at checkout.
export const deliverySlotRepository: IDeliverySlotRepository = new PrismaDeliverySlotRepository();
// Wallets are real data now — PostgreSQL via Prisma. Balance, saved cards and
// transactions are per-user; real users start empty and fill the wallet via the
// "Add Money" / "Add Card" flows. The demo wallet lives on in the seed migration.
export const walletRepository: IWalletRepository = new PrismaWalletRepository();
// Orders are real data now — PostgreSQL via Prisma. The demo order history lives
// on in the seed migration that backfilled the table; orders advance through
// delivery stages from the dashboard.
export const orderRepository: IOrderRepository = new PrismaOrderRepository();
// Internal, staff-facing notes on an order — append-only, and never shown to the
// customer (see `OrderNote`).
export const orderNoteRepository: IOrderNoteRepository = new PrismaOrderNoteRepository();
// Tracking composes the real order (its persisted stage drives the stepper) with
// a SIMULATED courier feed. The stage and the destination (snapshotted from the
// address at checkout) are production data; the movement is a stand-in — the
// courier position/ETA are interpolated from a synthetic trip clock along a
// straight-line route to that destination (see MockOrderTrackingRepository), and
// the rider is a static placeholder.
//
// Going live is a single swap here: bind `orderTrackingRepository` to a real
// adapter implementing `IOrderTrackingRepository`, fed by two paid services —
//   1. a courier GPS/telematics feed (the live `courier` point), and
//   2. a routing provider (Google Directions / Mapbox) for road-following
//      `route` geometry and a real `etaMinutes`.
// No caller changes: the port, route handler, polling hook and map are all
// provider-agnostic. Until then the mock's synthetic trip loops (~18 min) — a
// stand-in artifact documented on the mock, not a behaviour to preserve.
export const orderTrackingRepository: IOrderTrackingRepository = new MockOrderTrackingRepository(orderRepository);
// Carts and promo codes are real data now — PostgreSQL via Prisma. The cart is
// per-user (one `cart_items` row per user+product); the demo cart and the promo
// catalog live on in the seed migration that backfilled the tables.
export const cartRepository: ICartRepository = new PrismaCartRepository(productRepository);
export const promoCodeRepository: IPromoCodeRepository = new PrismaPromoCodeRepository();
// Back-in-stock alerts are real data — PostgreSQL via Prisma (per-user, one row per
// user+product). Delivery is stubbed: `LoggingStockAlertNotifier` logs the restock
// notification server-side; swap it for an email/SMS/push adapter here when a real
// channel is available — no use-case changes.
export const stockAlertRepository: IStockAlertRepository = new PrismaStockAlertRepository();
export const stockAlertNotifier: IStockAlertNotifier = new LoggingStockAlertNotifier();
// The store's VAT configuration — real data, PostgreSQL via Prisma. A single row,
// created lazily with its schema defaults (rate 0, disabled) on first read.
export const taxSettingsRepository: ITaxSettingsRepository = new PrismaTaxSettingsRepository();
// The refund ledger — real storage from the start, PostgreSQL via Prisma. No
// writers yet: `CancelOrder`, `ResolveOrderReturn` and the substitution flow keep
// crediting wallets directly until phase 5 has them emit a `Refund` row alongside
// each credit. Exported standalone (like `orderNoteRepository`) for read paths
// outside a unit of work; `PrismaUnitOfWork` binds its own instance for writers
// that need it in the same transaction as the order/wallet change it accompanies.
export const refundRepository: IRefundRepository = new PrismaRefundRepository();
// The order status event ledger — real storage from the start, PostgreSQL via
// Prisma. `PrismaOrderRepository` binds its own instance inside its own
// transaction to write from `transitionStatus`/`setTrackingStage`; exported
// standalone here for read paths (an order's history) outside that write path.
export const orderStatusEventLog: IOrderStatusEventLog = new PrismaOrderStatusEventLog();
// Editable copy for order-lifecycle notifications and admin-alert emails —
// real storage from the start, PostgreSQL via Prisma. All 12 rows are seeded
// by the migration; `buildOrderMessage`/`NotifyAdmins` fall back to their
// hardcoded copy if a row is ever missing (see `NotificationTemplate`).
export const notificationTemplateRepository: INotificationTemplateRepository =
  new PrismaNotificationTemplateRepository();

// Real SMS OTP when an SMS.ir key is configured; the in-memory mock otherwise so
// local dev works without credentials (the mock surfaces the code in the UI).
//
// TEMPORARY: set `OTP_MOCK=true` to force the in-memory mock even when an SMS.ir
// key is present — used while the SMS.ir provider is unresponsive so sign-in keeps
// working (the code is logged server-side and shown in the verify screen). The real
// `SmsIrAuthRepository` branch is left intact; clear `OTP_MOCK` to switch back.
const forceMockAuth = process.env.OTP_MOCK === "true";
export const authRepository: IAuthRepository =
  process.env.SMS_IR_API_KEY && !forceMockAuth
    ? new SmsIrAuthRepository({
        apiKey: process.env.SMS_IR_API_KEY,
        templateId: Number(process.env.SMS_IR_TEMPLATE_ID ?? SMS_IR_DEFAULT_TEMPLATE_ID),
        baseUrl: process.env.SMS_IR_BASE_URL,
      })
    : new MockAuthRepository();

// Transactional order notifications (confirmed → out for delivery → delivered,
// and approved returns). The notifier fans each event out to every channel:
//  - SMS: real SMS.ir pattern templates when an API key + per-event template ids
//    are configured (the market's primary channel); a logging stub otherwise —
//    the same real-or-mock switch used for `authRepository`.
//  - Push: a logging stub for now. Full web-push (service worker + VAPID +
//    subscription storage) is a follow-up; swapping the stub for a real
//    `WebPushNotificationChannel` here is the only change needed then.
// Every send is best-effort — a delivery failure never rolls back the order.
const notificationChannels: INotificationChannel[] = [
  process.env.SMS_IR_API_KEY
    ? new SmsIrNotificationChannel({
        apiKey: process.env.SMS_IR_API_KEY,
        baseUrl: process.env.SMS_IR_BASE_URL,
        templates: {
          order_confirmed: numericEnv("SMS_IR_ORDER_CONFIRMED_TEMPLATE_ID"),
          order_out_for_delivery: numericEnv("SMS_IR_ORDER_SHIPPED_TEMPLATE_ID"),
          order_delivered: numericEnv("SMS_IR_ORDER_DELIVERED_TEMPLATE_ID"),
          return_approved: numericEnv("SMS_IR_RETURN_APPROVED_TEMPLATE_ID"),
          item_substituted: numericEnv("SMS_IR_ITEM_SUBSTITUTED_TEMPLATE_ID"),
          item_refunded: numericEnv("SMS_IR_ITEM_REFUNDED_TEMPLATE_ID"),
        },
      })
    : new LoggingNotificationChannel("sms"),
  new LoggingNotificationChannel("push"),
];
export const orderNotifier: IOrderNotifier = new OrderNotifier(
  userRepository,
  notificationChannels,
  notificationTemplateRepository,
);

// Transactional email. Real SMTP when a host is configured, a logging stub
// otherwise — the same real-or-mock switch used for `authRepository`, so local dev
// and a fresh deployment work without mail credentials.
//
// SMTP rather than a provider HTTP API because this deploys to a VPS in Iran,
// where Resend/SendGrid/Postmark/Mailgun all geo-block the outbound call. See
// `SmtpEmailSender`.
export const emailSender: IEmailSender = process.env.SMTP_HOST
  ? new SmtpEmailSender({
      host: process.env.SMTP_HOST,
      port: numericEnv("SMTP_PORT") ?? 587,
      // Implicit TLS on 465; STARTTLS on 587 and everything else.
      secure: (numericEnv("SMTP_PORT") ?? 587) === 465,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM ?? "FreshDrop <no-reply@localhost>",
    })
  : new LoggingEmailSender();

// Announces team changes — an admin grant, and both sides of an ownership move —
// over email (when an address is on file) and SMS (when an approved pattern
// template is configured for that event). Every channel is best-effort; the
// change is already real either way.
export const teamNotifier: ITeamNotifier = new TeamNotifier(
  emailSender,
  process.env.SMS_IR_API_KEY
    ? {
        apiKey: process.env.SMS_IR_API_KEY,
        baseUrl: process.env.SMS_IR_BASE_URL,
        templates: {
          adminGranted: numericEnv("SMS_IR_ADMIN_INVITE_TEMPLATE_ID"),
          ownershipReceived: numericEnv("SMS_IR_OWNERSHIP_RECEIVED_TEMPLATE_ID"),
          ownershipLost: numericEnv("SMS_IR_OWNERSHIP_LOST_TEMPLATE_ID"),
        },
      }
    : undefined,
);

// Real provider (not a mock): Nominatim runs server-side only — the route
// handlers under `app/api/geocoding/*` are the only callers, which lets us send
// the required identifying `User-Agent` and keep the upstream off the client.
// Override the public OSM server / identity via env when self-hosting Nominatim.
export const geocodingRepository: IGeocodingRepository = new NominatimGeocodingRepository({
  baseUrl: process.env.NOMINATIM_BASE_URL,
  userAgent: process.env.NOMINATIM_USER_AGENT ?? "FreshDrop/0.1 (+https://example.com/contact)",
  language: process.env.NOMINATIM_LANGUAGE ?? "en",
  timeoutMs: Number(process.env.NOMINATIM_TIMEOUT_MS) || undefined,
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
