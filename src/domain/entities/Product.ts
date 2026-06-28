export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  badge?: string;
  /** Gallery shots for the product-detail carousel. Falls back to `[imageUrl]` when omitted. */
  images?: string[];
  /** Pack/measure shown under the name on the detail screen, e.g. "12 large eggs". */
  unit?: string;
  /** "Product detail" accordion copy. */
  description?: string;
  /** "Nutritions" accordion copy. */
  nutrition?: string;
  /** "Origins" accordion copy. */
  origin?: string;
}
