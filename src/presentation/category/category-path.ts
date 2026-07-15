import type { Category } from "@/src/domain/entities/Category";
import { slugify } from "@/src/lib/slugify";

/**
 * The decorative slug segment for a category detail URL. Derived from the
 * (already locale-resolved) category `name`, so it reads Persian under `fa` and
 * English under the default locale. The routing keys on the id, never this — it
 * exists only for humans and SEO. Falls back to the id for a degenerate name that
 * slugifies to nothing, so the final URL segment is never empty.
 */
export function categorySlug(category: Pick<Category, "id" | "name">): string {
  return slugify(category.name) || category.id;
}

/**
 * Canonical path to a category detail page: `/category/{id}/{slug}`. The id does
 * the routing (immutable and unique); the slug is decorative and may change when
 * the category is renamed. Locale-agnostic — pass it to the i18n `Link` /
 * `redirect`, which prepend the active locale.
 *
 * The slug segment is percent-encoded: a Persian slug is non-ASCII, and a raw
 * non-ASCII value in a redirect's `Location` header is rejected by Node's HTTP
 * layer ("Invalid character in header content"). Encoding keeps the header ASCII;
 * browsers still display it decoded.
 */
export function categoryHref(category: Pick<Category, "id" | "name">): string {
  return `/category/${category.id}/${encodeURIComponent(categorySlug(category))}`;
}

/**
 * Decode a URL slug segment for comparison against `categorySlug`. A route param can
 * arrive percent-encoded (a Persian slug always does), so decoding normalizes it to
 * the same space as the decoded `categorySlug`. Tolerates a malformed escape sequence
 * by returning the segment unchanged.
 */
export function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
