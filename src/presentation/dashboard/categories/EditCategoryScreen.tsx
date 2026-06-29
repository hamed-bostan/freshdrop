"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import { Button, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { categoriesApi } from "./category-api";
import { CategoryForm } from "./CategoryForm";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; category: Category };

/**
 * Edit screen. Fetches the category over the REST API (Axios) on mount, handling
 * loading / not-found / error states client-side before handing the data to the
 * shared `CategoryForm`.
 */
export function EditCategoryScreen({ id }: { id: string }) {
  const [state, setState] = React.useState<LoadState>({ status: "loading" });

  const load = React.useCallback(async () => {
    setState({ status: "loading" });
    try {
      const category = await categoriesApi.get(id);
      setState({ status: "ready", category });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState({ status: "not-found" });
        return;
      }
      const message = error instanceof ApiError ? error.message : "Couldn't load this category.";
      setState({ status: "error", message });
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <div className="flex max-w-xl items-center justify-center gap-2 px-6 py-16 text-muted-foreground">
        <Icon icon={Loader2} size="sm" className="animate-spin" />
        <span className="text-body-b6">Loading…</span>
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="flex max-w-xl flex-col gap-3">
        <h1 className="text-heading-h2 text-foreground">Category not found</h1>
        <p className="text-body-b6 text-muted-foreground">It may have already been deleted.</p>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href="/dashboard">Back to categories</Link>
        </Button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex max-w-xl flex-col gap-3">
        <h1 className="text-heading-h2 text-foreground">Couldn&apos;t load category</h1>
        <p className="text-body-b6 text-muted-foreground">{state.message}</p>
        <Button variant="outline" size="sm" className="self-start" onClick={load}>
          <Icon icon={RotateCcw} size="sm" className="mr-1.5" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">Edit category</h1>
        <p className="text-body-b6 text-muted-foreground">Update “{state.category.name}”.</p>
      </div>
      <CategoryForm mode="edit" category={state.category} />
    </div>
  );
}
