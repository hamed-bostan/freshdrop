"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import type { ProductTranslationInput } from "@/src/domain/repositories/IProductRepository";
import { DIETARY_TAGS, PRODUCT_BRANDS } from "@/src/domain/entities/ProductFilters";
import { Button, Field, Input, Switch, TextField, Textarea } from "@/src/presentation/design-system";
import { Link, useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { cn } from "@/src/lib/utils";
import { productFormSchema, type ProductFormInput } from "./product-schema";
import { productsApi } from "./product-api";
import { ProductImageUpload } from "./ProductImageUpload";

/** Fields the API can return targeted `fieldErrors` for. */
const FORM_FIELDS = [
  "name",
  "categoryId",
  "price",
  "originalPrice",
  "stockQuantity",
  "imageUrl",
  "badge",
  "unit",
  "description",
  "nutrition",
  "origin",
  "brand",
  "dietary",
] as const satisfies readonly (keyof ProductFormInput)[];

/** Native-select styling that matches the DS field family (no DS Select yet). */
const SELECT_CLASSES =
  "h-10 w-full rounded-input border border-border bg-input px-3 text-body-b6 text-input-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive disabled:cursor-not-allowed disabled:opacity-50";

type ProductFormProps =
  | { mode: "create"; categories: Category[] }
  | { mode: "edit"; categories: Category[]; product: Product; translations: ProductTranslationInput[] };

/** Build the form's initial values, coercing the numeric/optional domain fields to the string controls. */
function toDefaults(product?: Product, translations?: ProductTranslationInput[]): ProductFormInput {
  const fa = translations?.find((translation) => translation.locale === "fa");
  return {
    name: product?.name ?? "",
    categoryId: product?.categoryId ?? "",
    price: product != null ? String(product.price) : "",
    originalPrice: product?.originalPrice != null ? String(product.originalPrice) : "",
    stockQuantity: product != null ? String(product.stockQuantity) : "",
    imageUrl: product?.imageUrl ?? "",
    isFeatured: product?.isFeatured ?? false,
    badge: product?.badge ?? "",
    unit: product?.unit ?? "",
    description: product?.description ?? "",
    nutrition: product?.nutrition ?? "",
    origin: product?.origin ?? "",
    brand: product?.brand ?? "",
    dietary: product?.dietary ?? [],
    faName: fa?.name ?? "",
    faUnit: fa?.unit ?? "",
    faDescription: fa?.description ?? "",
    faNutrition: fa?.nutrition ?? "",
    faOrigin: fa?.origin ?? "",
  };
}

/**
 * Create/edit product form. React Hook Form + Zod (shared `productFormSchema`).
 * Numeric fields are authored as strings; the schema *validates* them but the
 * resolver runs in `raw` mode so the form keeps (and submits) the string input
 * shape — the route handler's schema is what coerces it to the numeric domain
 * model. Submits over the REST API via `productsApi` (Axios); on success it
 * navigates back to the list, and an `ApiError` surfaces inline — field-specific
 * messages on the offending fields, otherwise at the root.
 */
export function ProductForm(props: ProductFormProps) {
  const t = useTranslations("dashProducts");
  const editing = props.mode === "edit";
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema, undefined, { raw: true }),
    defaultValues: toDefaults(
      editing ? props.product : undefined,
      editing ? props.translations : undefined,
    ),
  });

  const imageUrl = useWatch({ control, name: "imageUrl" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) await productsApi.update(props.product.id, values);
      else await productsApi.create(values);
      router.push("/dashboard/products");
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("formError") });
        return;
      }
      // Prefer field-level messages so they read in context; fall back to a single
      // root message when the API didn't scope the error.
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
      <TextField label={t("nameLabel")} required error={errors.name?.message}>
        {(control) => <Input {...control} {...register("name")} placeholder={t("namePlaceholder")} />}
      </TextField>

      <Field error={errors.categoryId?.message}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              {t("categoryLabel")}
              <span aria-hidden className="text-destructive"> *</span>
            </label>
            <select
              id={id}
              className={SELECT_CLASSES}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              {...register("categoryId")}
            >
              <option value="" disabled>
                {t("selectCategory")}
              </option>
              {props.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label={t("priceLabel")}
          required
          description={t("priceDescription")}
          error={errors.price?.message}
        >
          {(control) => (
            <Input {...control} {...register("price")} inputMode="decimal" placeholder={t("pricePlaceholder")} />
          )}
        </TextField>

        <TextField
          label={t("originalPriceLabel")}
          description={t("originalPriceDescription")}
          error={errors.originalPrice?.message}
        >
          {(control) => (
            <Input {...control} {...register("originalPrice")} inputMode="decimal" placeholder={t("pricePlaceholder")} />
          )}
        </TextField>
      </div>

      <TextField
        label={t("stockLabel")}
        required
        description={t("stockDescription")}
        error={errors.stockQuantity?.message}
      >
        {(control) => (
          <Input {...control} {...register("stockQuantity")} inputMode="numeric" placeholder={t("stockPlaceholder")} />
        )}
      </TextField>

      <Field error={errors.imageUrl?.message}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              {t("imageLabel")}
              <span aria-hidden className="text-destructive"> *</span>
            </label>
            <ProductImageUpload
              id={id}
              value={imageUrl}
              onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
            />
          </>
        )}
      </Field>
      {/* Keeps imageUrl registered (set imperatively by ProductImageUpload) so it's tracked + submitted. */}
      <input type="hidden" {...register("imageUrl")} />

      <div className="grid grid-cols-2 gap-4">
        <TextField label={t("unitLabel")} description={t("unitDescription")} error={errors.unit?.message}>
          {(control) => <Input {...control} {...register("unit")} placeholder={t("unitPlaceholder")} />}
        </TextField>

        <TextField label={t("badgeLabel")} description={t("badgeDescription")} error={errors.badge?.message}>
          {(control) => <Input {...control} {...register("badge")} placeholder={t("badgePlaceholder")} />}
        </TextField>
      </div>

      <Field error={errors.brand?.message}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              {t("brandLabel")}
            </label>
            <select
              id={id}
              className={SELECT_CLASSES}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              {...register("brand")}
            >
              <option value="">{t("noBrand")}</option>
              {PRODUCT_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </>
        )}
      </Field>

      <Controller
        control={control}
        name="dietary"
        render={({ field }) => (
          <fieldset>
            <legend className="text-body-b7 text-input-foreground">{t("dietaryLegend")}</legend>
            <p className="mb-2 text-body-b10 text-muted-foreground">
              {t("dietaryDescription")}
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => {
                const checked = field.value?.includes(tag) ?? false;
                return (
                  <label
                    key={tag}
                    className={cn(
                      "flex h-10 cursor-pointer items-center rounded-full border px-4 text-button-btn4 transition-colors",
                      "focus-within:ring-2 focus-within:ring-ring",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(event) =>
                        field.onChange(
                          event.target.checked
                            ? [...(field.value ?? []), tag]
                            : (field.value ?? []).filter((item: string) => item !== tag),
                        )
                      }
                    />
                    {tag}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="isFeatured"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-card-md border border-border px-4 py-3">
            <div>
              <label htmlFor="isFeatured" className="text-body-b7 text-input-foreground">
                {t("featuredLabel")}
              </label>
              <p className="text-body-b10 text-muted-foreground">{t("featuredDescription")}</p>
            </div>
            <Switch
              id="isFeatured"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={t("featuredAria")}
            />
          </div>
        )}
      />

      <TextField label={t("descriptionLabel")} error={errors.description?.message}>
        {(control) => (
          <Textarea {...control} {...register("description")} placeholder={t("descriptionPlaceholder")} />
        )}
      </TextField>

      <TextField label={t("nutritionLabel")} error={errors.nutrition?.message}>
        {(control) => <Textarea {...control} {...register("nutrition")} placeholder={t("nutritionPlaceholder")} />}
      </TextField>

      <TextField label={t("originLabel")} error={errors.origin?.message}>
        {(control) => <Textarea {...control} {...register("origin")} placeholder={t("originPlaceholder")} />}
      </TextField>

      {/* Persian (fa) content overrides. Optional — leaving the name blank stores no
          fa translation, so the storefront falls back to the fields above under fa. */}
      <fieldset className="flex flex-col gap-5 rounded-card-md border border-border p-4">
        <legend className="px-1 text-body-b7 text-input-foreground">{t("translationLegend")}</legend>
        <p className="-mt-2 text-body-b10 text-muted-foreground">{t("translationDescription")}</p>

        <TextField label={t("faNameLabel")} error={errors.faName?.message}>
          {(control) => <Input {...control} {...register("faName")} dir="rtl" placeholder={t("faNamePlaceholder")} />}
        </TextField>

        <TextField label={t("faUnitLabel")} error={errors.faUnit?.message}>
          {(control) => <Input {...control} {...register("faUnit")} dir="rtl" placeholder={t("faUnitPlaceholder")} />}
        </TextField>

        <TextField label={t("faDescriptionLabel")} error={errors.faDescription?.message}>
          {(control) => <Textarea {...control} {...register("faDescription")} dir="rtl" />}
        </TextField>

        <TextField label={t("faNutritionLabel")} error={errors.faNutrition?.message}>
          {(control) => <Textarea {...control} {...register("faNutrition")} dir="rtl" />}
        </TextField>

        <TextField label={t("faOriginLabel")} error={errors.faOrigin?.message}>
          {(control) => <Textarea {...control} {...register("faOrigin")} dir="rtl" />}
        </TextField>
      </fieldset>

      {errors.root?.message && (
        <p role="alert" className="text-body-b8 text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {editing ? t("saveChanges") : t("createProduct")}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/products">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
