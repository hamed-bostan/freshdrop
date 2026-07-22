/**
 * Compile-time proof that every response schema describes its entity EXACTLY.
 *
 * Each schema already carries `satisfies z.ZodType<Entity>`, which looks like it
 * covers this and doesn't. That constraint only asks whether the schema's output
 * is *assignable* to the entity, and a type with extra properties is assignable
 * to one without them. So it rejects a missing or mistyped key, and happily
 * accepts a key the entity doesn't have — which is a schema demanding a field
 * nothing produces, i.e. a response that fails to parse in production while the
 * build stays green. That is exactly how the tracking page broke: the schema kept
 * requiring `step.label` and `rider.role` after both were deleted from the entity.
 *
 * The other direction is quieter but just as wrong. `z.object()` strips unknown
 * keys, so a field the entity has and the schema omits is silently deleted from
 * every response, and the loss only surfaces whenever someone finally reads it.
 *
 * `Equal` is invariant, so it catches both. This file emits nothing — it is types
 * only, checked by the same `tsc` run as everything else.
 *
 * ONE LIMITATION, worth knowing: the list below is maintained by hand. TypeScript
 * can't enumerate the project's schemas for us, so a NEW `*-response-schema.ts`
 * is not covered until someone adds a line here. Adding one is the last step of
 * writing a response schema.
 */
import type { z } from "zod";

/**
 * Flattens an intersection into a plain object type. Entities written as
 * `Omit<T, "k"> & { k: U }` are structurally identical to the flat shape but not
 * *represented* identically, and `Equal` is strict enough to tell the difference
 * — a distinction with no bearing on whether a response parses. Homomorphic, so
 * optional and readonly modifiers survive and real mismatches still fail.
 */
type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * True only when A and B are identical — not merely mutually assignable. The
 * two-conditional form defeats the compiler's structural leniency, which is the
 * whole point: assignability is what let the drift through.
 */
type Equal<A, B> =
  (<T>() => T extends Simplify<A> ? 1 : 2) extends <T>() => T extends Simplify<B> ? 1 : 2 ? true : false;

/** Fails the build with "Type 'false' does not satisfy the constraint 'true'". */
type Expect<T extends true> = T;

import type { Cart } from "@/src/domain/entities/Cart";
import type { Category } from "@/src/domain/entities/Category";
import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import type { CustomerDetail, CustomerLifetime } from "@/src/domain/entities/CustomerDetail";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { Order } from "@/src/domain/entities/Order";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import type { Product } from "@/src/domain/entities/Product";
import type { PromoCode } from "@/src/domain/entities/PromoCode";
import type { PublicReview } from "@/src/domain/entities/Review";
import type { SavedCard, Wallet } from "@/src/domain/entities/Wallet";
import type { CategoryTranslationInput } from "@/src/domain/repositories/ICategoryRepository";
import type { ProductTranslationInput } from "@/src/domain/repositories/IProductRepository";
import type { ReorderItemsResult } from "@/src/domain/use-cases/orders/ReorderItems";

import { cartResponseSchema } from "./cart/cart-response-schema";
import { promoCodeResponseSchema } from "./cart/promo-code-response-schema";
import { categoryResponseSchema } from "./category/category-response-schema";
import { deliverySlotDayResponseSchema } from "./checkout/delivery-slot-response-schema";
import { categoryTranslationResponseSchema } from "./dashboard/categories/category-translation-response-schema";
import { customerOrderSummaryResponseSchema } from "./dashboard/customers/customer-response-schema";
import {
  customerDetailResponseSchema,
  customerLifetimeResponseSchema,
} from "./dashboard/customers/customer-detail-response-schema";
import { adminPromoCodeResponseSchema } from "./dashboard/promo-codes/promo-code-admin-response-schema";
import { deliveryWindowResponseSchema } from "./dashboard/delivery-slots/delivery-window-response-schema";
import { productTranslationResponseSchema } from "./dashboard/products/product-translation-response-schema";
import {
  activityEntryResponseSchema,
  type ActivityEntryWire,
} from "./dashboard/activity/activity-response-schema";
import { deliveryLocationResponseSchema } from "./delivery-location/delivery-location-response-schema";
import { orderResponseSchema, reorderResultResponseSchema } from "./orders/order-response-schema";
import { orderTrackingResponseSchema } from "./orders/order-tracking-response-schema";
import { paymentMethodResponseSchema } from "./payment/payment-method-response-schema";
import { productResponseSchema } from "./product/product-response-schema";
import { reviewResponseSchema } from "./product/review-response-schema";
import { userResponseSchema, type UserProfile } from "./profile/profile-response-schema";
import { savedCardResponseSchema, walletResponseSchema } from "./wallet/wallet-response-schema";

export type _Cart = Expect<Equal<z.infer<typeof cartResponseSchema>, Cart>>;
export type _PromoCode = Expect<Equal<z.infer<typeof promoCodeResponseSchema>, PromoCode>>;
export type _Category = Expect<Equal<z.infer<typeof categoryResponseSchema>, Category>>;
// The admin promo-code shape is a superset of the public one, and the gap is the
// point: the campaign window, the switch and the redemption counter belong to the
// operator's response, never the shopper's. Both are asserted, so a field added to
// the entity has to be placed deliberately on one side or the other.
export type _AdminPromoCode = Expect<Equal<z.infer<typeof adminPromoCodeResponseSchema>, AdminPromoCode>>;
export type _DeliveryWindow = Expect<Equal<z.infer<typeof deliveryWindowResponseSchema>, DeliveryWindow>>;
export type _DeliverySlotDay = Expect<Equal<z.infer<typeof deliverySlotDayResponseSchema>, DeliverySlotDay>>;
export type _CategoryTranslation = Expect<
  Equal<z.infer<typeof categoryTranslationResponseSchema>, CategoryTranslationInput>
>;
export type _CustomerOrderSummary = Expect<
  Equal<z.infer<typeof customerOrderSummaryResponseSchema>, CustomerOrderSummary>
>;
export type _ProductTranslation = Expect<
  Equal<z.infer<typeof productTranslationResponseSchema>, ProductTranslationInput>
>;
export type _ActivityEntry = Expect<
  Equal<z.infer<typeof activityEntryResponseSchema>, ActivityEntryWire>
>;
export type _DeliveryLocation = Expect<Equal<z.infer<typeof deliveryLocationResponseSchema>, DeliveryLocation>>;
export type _Order = Expect<Equal<z.infer<typeof orderResponseSchema>, Order>>;
export type _ReorderItemsResult = Expect<Equal<z.infer<typeof reorderResultResponseSchema>, ReorderItemsResult>>;
export type _OrderTracking = Expect<Equal<z.infer<typeof orderTrackingResponseSchema>, OrderTracking>>;
export type _PaymentMethod = Expect<Equal<z.infer<typeof paymentMethodResponseSchema>, PaymentMethod>>;
export type _Product = Expect<Equal<z.infer<typeof productResponseSchema>, Product>>;
// A `PublicReview`, not a `Review`: `authorId` is the reviewer's account id, which in
// this app is their phone digits, so no endpoint sends it (see `toPublicReview`).
// Same shape of boundary as `UserProfile` below — and this is the assertion that
// catches it if the field ever creeps back onto the wire.
export type _Review = Expect<Equal<z.infer<typeof reviewResponseSchema>, PublicReview>>;
// `UserProfile` is `Omit<User, "role">`, and that omission is a security boundary:
// the schema strips `role` so no client can branch on an authorization fact read
// from a response body. Re-adding it — or leaving any field behind after the entity
// drops one — is the extra-key direction, which `satisfies z.ZodType<UserProfile>`
// accepts in silence. Verified: adding `role` back fails here and nowhere else.
export type _UserProfile = Expect<Equal<z.infer<typeof userResponseSchema>, UserProfile>>;
export type _SavedCard = Expect<Equal<z.infer<typeof savedCardResponseSchema>, SavedCard>>;
export type _Wallet = Expect<Equal<z.infer<typeof walletResponseSchema>, Wallet>>;
