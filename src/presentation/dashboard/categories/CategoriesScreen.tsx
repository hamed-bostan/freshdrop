"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Plus, RotateCcw } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import { Button, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { categoriesApi } from "./category-api";
import { CategoriesTable } from "./CategoriesTable";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; categories: Category[] };

/**
 * Admin categories list. Fetches over the REST API (Axios) on mount and renders
 * loading / error / empty / ready states client-side — mirroring how a decoupled
 * frontend talks to a separate backend.
 */
export function CategoriesScreen() {
  const [state, setState] = React.useState<LoadState>({ status: "loading" });

  const load = React.useCallback(async () => {
    setState({ status: "loading" });
    try {
      const categories = await categoriesApi.list();
      setState({ status: "ready", categories });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Couldn't load categories.";
      setState({ status: "error", message });
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Drop the row locally after a delete instead of refetching the whole list.
  const handleDeleted = React.useCallback((id: string) => {
    setState((prev) =>
      prev.status === "ready"
        ? { status: "ready", categories: prev.categories.filter((category) => category.id !== id) }
        : prev,
    );
  }, []);

  const count = state.status === "ready" ? state.categories.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">Categories</h1>
          {state.status === "ready" && (
            <p className="text-body-b6 text-muted-foreground">
              {count} {count === 1 ? "category" : "categories"}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/dashboard/create">
            <Icon icon={Plus} size="sm" className="mr-1.5" />
            New category
          </Link>
        </Button>
      </div>

      {state.status === "loading" && (
        <div className="flex items-center justify-center gap-2 rounded-card-lg border border-border px-6 py-16 text-muted-foreground">
          <Icon icon={Loader2} size="sm" className="animate-spin" />
          <span className="text-body-b6">Loading categories…</span>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">Couldn&apos;t load categories</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">{state.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>
            <Icon icon={RotateCcw} size="sm" className="mr-1.5" />
            Try again
          </Button>
        </div>
      )}

      {state.status === "ready" &&
        (count > 0 ? (
          <CategoriesTable categories={state.categories} onDeleted={handleDeleted} />
        ) : (
          <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
            <p className="text-body-b4 text-foreground">No categories yet</p>
            <p className="mt-1 text-body-b6 text-muted-foreground">
              Create your first category to get started.
            </p>
          </div>
        ))}
    </div>
  );
}
