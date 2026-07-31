import { z } from "zod";
import type { CustomerDetail, CustomerLifetime } from "@/src/domain/entities/CustomerDetail";
import { USER_ROLES } from "@/src/domain/entities/User";
import { deliveryLocationResponseSchema } from "@/src/presentation/delivery-location/delivery-location-response-schema";
import { orderResponseSchema } from "@/src/presentation/orders/order-response-schema";
import { orderNoteResponseSchema } from "@/src/contracts/order-note-schema";
import { reviewResponseSchema } from "@/src/presentation/product/review-response-schema";
import { walletResponseSchema } from "@/src/presentation/wallet/wallet-response-schema";

/** The lifetime figures, derived server-side from the customer's own orders. */
export const customerLifetimeResponseSchema = z.object({
  orderCount: z.number(),
  totalSpent: z.number(),
  averageOrderValue: z.number(),
  firstOrderAt: z.string().nullable(),
  lastOrderAt: z.string().nullable(),
}) satisfies z.ZodType<CustomerLifetime>;

/**
 * What `GET /api/admin/customers/:id` promises, validated at the typed-service
 * boundary (see `parseApiResponse`).
 *
 * Composed from the schemas the storefront already uses for the same entities —
 * orders, addresses, wallet, reviews — rather than restating their fields. The
 * endpoint serves the *same* records to a different audience, so a second
 * description of them could only ever drift from the first.
 */
export const customerDetailResponseSchema = z.object({
  userId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.enum(USER_ROLES),
  hasProfile: z.boolean(),
  lifetime: customerLifetimeResponseSchema,
  orders: z.array(orderResponseSchema),
  notes: z.array(orderNoteResponseSchema),
  addresses: z.array(deliveryLocationResponseSchema),
  wallet: walletResponseSchema,
  reviews: z.array(reviewResponseSchema),
}) satisfies z.ZodType<CustomerDetail>;
