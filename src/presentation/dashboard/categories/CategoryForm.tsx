"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category } from "@/src/domain/entities/Category";
import { Button, Field, Input, TextField } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { slugify } from "@/src/lib/slugify";
import { categoryFormSchema, type CategoryFormValues } from "./category-schema";
import { categoriesApi } from "./category-api";
import { IconUpload } from "./IconUpload";

/** Fields the API can return targeted `fieldErrors` for. */
const FORM_FIELDS = ["name", "slug", "iconUrl"] as const;

type CategoryFormProps = { mode: "create" } | { mode: "edit"; category: Category };

/**
 * Create/edit category form. React Hook Form + Zod (shared `categoryFormSchema`).
 * The DS fields aren't `forwardRef`, so RHF's `register` is spread onto `Input`
 * via `TextField`'s render-prop. Submits over the REST API via `categoriesApi`
 * (Axios); on success it navigates back to the list, and an `ApiError` surfaces
 * inline — field-specific messages on the offending fields, otherwise at the root.
 */
export function CategoryForm(props: CategoryFormProps) {
  const editing = props.mode === "edit";
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: editing
      ? { name: props.category.name, slug: props.category.slug, iconUrl: props.category.iconUrl }
      : { name: "", slug: "", iconUrl: "" },
  });

  // Mirror the name into the slug until the user edits the slug directly (and
  // never auto-overwrite an existing slug when editing).
  const [slugLocked, setSlugLocked] = React.useState(editing);
  const iconUrl = useWatch({ control, name: "iconUrl" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) await categoriesApi.update(props.category.id, values);
      else await categoriesApi.create(values);
      router.push("/dashboard/categories");
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: "Something went wrong. Please try again." });
        return;
      }
      // Prefer field-level messages (e.g. a taken slug) so they read in context;
      // fall back to a single root message when the API didn't scope the error.
      let appliedField = false;
      for (const field of FORM_FIELDS) {
        const message = error.fieldErrors?.[field];
        if (message) {
          setError(field, { message });
          appliedField = true;
        }
      }
      if (!appliedField) setError("root", { message: error.message });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <TextField label="Name" required error={errors.name?.message}>
        {(control) => (
          <Input
            {...control}
            {...register("name", {
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                if (!slugLocked) setValue("slug", slugify(event.target.value), { shouldValidate: true });
              },
            })}
            placeholder="e.g. Vegetables"
          />
        )}
      </TextField>

      <TextField
        label="Slug"
        required
        description="Appears in the URL: /category/<slug>"
        error={errors.slug?.message}
      >
        {(control) => (
          <Input
            {...control}
            {...register("slug", { onChange: () => setSlugLocked(true) })}
            placeholder="e.g. vegetables"
          />
        )}
      </TextField>

      <Field error={errors.iconUrl?.message}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              Icon image
              <span aria-hidden className="text-destructive"> *</span>
            </label>
            <IconUpload
              id={id}
              value={iconUrl}
              onChange={(url) => setValue("iconUrl", url, { shouldValidate: true })}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
            />
          </>
        )}
      </Field>
      {/* Keeps iconUrl registered (set imperatively by IconUpload) so it's tracked + submitted. */}
      <input type="hidden" {...register("iconUrl")} />

      {errors.root?.message && (
        <p role="alert" className="text-body-b8 text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {editing ? "Save changes" : "Create category"}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/categories">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
