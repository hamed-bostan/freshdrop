import { notFound } from "next/navigation";
import { EditCategoryScreen } from "@/src/presentation/dashboard/categories/EditCategoryScreen";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

// The category is fetched over the REST API (BFF) during server render; a missing
// one renders the not-found boundary. The screen is presentational from there.
export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const category = await categoriesServerApi.getById(id);
  if (!category) notFound();

  return <EditCategoryScreen category={category} />;
}
