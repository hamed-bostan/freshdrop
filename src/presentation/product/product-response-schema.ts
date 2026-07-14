import { z } from "zod";
import type { Product } from "@/src/domain/entities/Product";

/**
 * The shape a product endpoint promises to return, validated at the typed-service
 * boundary (see `parseApiResponse`). The catalog's canonical response schema — the
 * dashboard, the storefront, search, favorites and the picker's replacement
 * candidates all read products from the same endpoints, so they all read them
 * through this.
 *
 * Distinct from `dashboard/products/product-schema.ts`, which validates *form
 * input* (strings coerced to numbers, no `id`). This one describes what the API
 * sends back.
 */
export const productResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  discountPercent: z.number().optional(),
  rating: z.number(),
  ratingCount: z.number(),
  stockQuantity: z.number(),
  imageUrl: z.string(),
  categoryId: z.string(),
  isFeatured: z.boolean(),
  badge: z.string().optional(),
  images: z.array(z.string()).optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  nutrition: z.string().optional(),
  origin: z.string().optional(),
  brand: z.string().optional(),
  dietary: z.array(z.string()).optional(),
}) satisfies z.ZodType<Product>;

export const productListResponseSchema = z.array(productResponseSchema);
