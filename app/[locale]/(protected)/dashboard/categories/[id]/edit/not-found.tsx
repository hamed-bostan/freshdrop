import Link from "next/link";
import { Button } from "@/src/presentation/design-system";

/** Shown when editing a category that no longer exists (the page called `notFound()`). */
export default function EditCategoryNotFound() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-heading-h2 text-foreground">Category not found</h1>
      <p className="text-body-b6 text-muted-foreground">It may have already been deleted.</p>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href="/dashboard/categories">Back to categories</Link>
      </Button>
    </div>
  );
}
