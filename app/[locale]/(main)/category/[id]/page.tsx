import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { permanentRedirect } from "@/src/i18n/navigation";
import { categoryHref } from "@/src/presentation/category/category-path";
import { categoriesServerApi } from "@/src/presentation/category/category-server-api";

interface CategoryRedirectPageProps {
  // Named `id` to match the `[id]/[slug]` segment below it, but a legacy
  // `/category/{slug}` URL lands here too — so `param` may be either.
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

/**
 * Canonicalizing entry point for a category with no slug segment. Serves two
 * cases with one permanent redirect to `/category/{id}/{slug}`:
 *  - `/category/{id}` — the bare-id shortcut
 *  - `/category/{slug}` — the pre-id-prefix URL scheme (old links and bookmarks)
 */
export default async function CategoryRedirectPage({ params }: CategoryRedirectPageProps) {
  const { id: param } = await params;

  const category = (await categoriesServerApi.getById(param)) ?? (await categoriesServerApi.getBySlug(param));
  if (!category) notFound();

  permanentRedirect({ href: categoryHref(category), locale: await getLocale() });
}
