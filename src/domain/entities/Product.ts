export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  ratingCount: number;
  /** Units on hand available to sell. 0 = out of stock; the storefront blocks add-to-cart and checkout can't oversell. */
  stockQuantity: number;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  /**
   * Whether the storefront may show it. `false` takes the product out of the
   * catalog, search, every rail and add-to-cart, without touching its stock ledger
   * or the order lines that already reference it — the difference between
   * withdrawing a product and deleting one.
   *
   * Orthogonal to {@link Product.isFeatured}: that promotes a product *within* the
   * storefront, this decides whether it's in it at all. An unpublished product can
   * still carry `isFeatured`, and gets it back when it's published again.
   */
  isPublished: boolean;
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
  /** Brand the product is sold under; drives the brand filter. Optional — not every product has one. */
  brand?: string;
  /** Dietary tags the product satisfies (see `DIETARY_TAGS`); drives the dietary filter. */
  dietary?: string[];
}
