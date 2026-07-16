import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { permanentRedirect } from "@/src/i18n/navigation";
import { categoriesServerApi } from "@/src/presentation/category/category-server-api";
import { productsServerApi } from "@/src/presentation/product/product-server-api";
import { categorySlug, categoryHref, decodeSlug } from "@/src/presentation/category/category-path";
import CategoryDetailScreen from "@/src/presentation/category/CategoryDetailScreen";

interface CategoryDetailPageProps {
  params: Promise<{ id: string; slug: string }>;
}

// Category + products are fetched from the REST API at request time — render dynamically.
export const dynamic = "force-dynamic";

// Per-request memo so `generateMetadata` and the page render share one BFF fetch.
const getCategory = cache((id: string) => categoriesServerApi.getById(id));

/**
 * Localized document metadata: the category's (translated) name fills the layout's
 * `%s · FreshDrop` title template. A missing category contributes nothing — the page
 * render 404s right after.
 */
export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategory(id);
  return category ? { title: category.name } : {};
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { id, slug } = await params;

  // The id is the source of truth; the slug is decorative.
  const category = await getCategory(id);
  if (!category) notFound();

  // Keep one indexable address per category: if the slug in the URL isn't the
  // current (localized) one — a stale bookmark, a rename, or a hand-typed URL —
  // send a permanent redirect to the canonical `/category/{id}/{slug}`. Decode the
  // segment first: a Persian slug arrives percent-encoded, and comparing it raw
  // against the decoded `categorySlug` would redirect every time (an endless loop).
  if (decodeSlug(slug) !== categorySlug(category)) {
    permanentRedirect({ href: categoryHref(category), locale: await getLocale() });
  }

  const products = await productsServerApi.listByCategory(category.id);

  return <CategoryDetailScreen category={category} products={products} />;
}
