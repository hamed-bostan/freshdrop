import { notFound } from "next/navigation";
import { EditCategoryScreen } from "@/src/presentation/dashboard/categories/EditCategoryScreen";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";
import { requirePermission } from "@/src/lib/require-permission";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

// The category is fetched over the REST API (BFF) during server render; a missing
// one renders the not-found boundary. The screen is presentational from there.
export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("catalog.write");

  const { id } = await params;
  const [category, translations] = await Promise.all([
    categoriesServerApi.getById(id),
    categoriesServerApi.getTranslations(id),
  ]);
  if (!category) notFound();

  return <EditCategoryScreen category={category} translations={translations} />;
}
