"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateCategory } from "@/src/domain/use-cases/categories/CreateCategory";
import { UpdateCategory } from "@/src/domain/use-cases/categories/UpdateCategory";
import { DeleteCategory } from "@/src/domain/use-cases/categories/DeleteCategory";
import { GetCategoryBySlug } from "@/src/domain/use-cases/categories/GetCategoryBySlug";
import { categoryRepository, imageStorageRepository } from "@/src/infrastructure/container";
import { UniqueConstraintError } from "@/src/domain/errors/UniqueConstraintError";
import { requireAdmin } from "@/src/lib/require-admin";
import { categoryFormSchema, type CategoryFormValues } from "./category-schema";

export type ActionResult = { ok: true } | { error: string };

/** Refresh every surface that lists categories after a write. */
function revalidateCategories(): void {
  revalidatePath("/dashboard");
  revalidatePath("/category");
  revalidatePath("/");
}

/** First validation message, or a generic fallback. */
function firstIssue(values: CategoryFormValues): { data: CategoryFormValues } | { error: string } {
  const parsed = categoryFormSchema.safeParse(values);
  if (parsed.success) return { data: parsed.data };
  return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
}

export async function createCategory(values: CategoryFormValues): Promise<ActionResult> {
  await requireAdmin();

  const result = firstIssue(values);
  if ("error" in result) return result;

  // Friendly, repository-agnostic uniqueness check; the DB's unique constraint
  // remains the ultimate guard (a race would surface as the generic error below).
  const existing = await new GetCategoryBySlug(categoryRepository).execute(result.data.slug);
  if (existing) return { error: "That slug is already taken." };

  try {
    await new CreateCategory(categoryRepository).execute(result.data);
  } catch (error) {
    // Catches the race the pre-check can't: a concurrent insert with the same
    // slug trips the DB's unique constraint. slug is Category's only unique
    // field, so any unique violation here is a slug collision.
    if (error instanceof UniqueConstraintError) return { error: "That slug is already taken." };
    console.error("createCategory failed:", error);
    return { error: "Couldn't create the category. Please try again." };
  }

  revalidateCategories();
  redirect("/dashboard");
}

export async function updateCategory(id: string, values: CategoryFormValues): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { error: "Missing category id." };

  const result = firstIssue(values);
  if ("error" in result) return result;

  const existing = await new GetCategoryBySlug(categoryRepository).execute(result.data.slug);
  if (existing && existing.id !== id) return { error: "That slug is already taken." };

  try {
    await new UpdateCategory(categoryRepository, imageStorageRepository).execute(id, result.data);
  } catch (error) {
    // A concurrent rename to a slug another category just took trips the DB's
    // unique constraint; slug is Category's only unique field (see createCategory).
    if (error instanceof UniqueConstraintError) return { error: "That slug is already taken." };
    console.error("updateCategory failed:", error);
    return { error: "Couldn't update the category. Please try again." };
  }

  revalidateCategories();
  redirect("/dashboard");
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return { error: "Missing category id." };

  try {
    await new DeleteCategory(categoryRepository, imageStorageRepository).execute(id);
  } catch (error) {
    console.error("deleteCategory failed:", error);
    return { error: "Couldn't delete the category. Please try again." };
  }

  revalidateCategories();
  return { ok: true };
}
