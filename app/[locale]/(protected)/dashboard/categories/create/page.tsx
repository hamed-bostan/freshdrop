import { getTranslations } from "next-intl/server";
import { CategoryForm } from "@/src/presentation/dashboard/categories/CategoryForm";

export default async function CreateCategoryPage() {
  const t = await getTranslations("dashCategories");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("newCategory")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("createSubtitle")}</p>
      </div>
      <CategoryForm mode="create" />
    </div>
  );
}
