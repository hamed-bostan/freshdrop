import {EditCategoryScreen} from "@/src/presentation/dashboard/categories/EditCategoryScreen";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

// The category is fetched client-side over the REST API (see EditCategoryScreen);
// this server shell only unwraps the route param.
export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  return <EditCategoryScreen id={id} />;
}
