"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { productFormSchema, type ProductFormInput } from "@/src/contracts/product-schema";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { DIETARY_TAGS, PRODUCT_BRANDS } from "@/src/domain/entities/ProductFilters";
import type { ProductTranslationInput } from "@/src/domain/repositories/IProductRepository";
import { Link, useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import {
  Button,
  Field,
  FormMessage,
  Input,
  RequiredMark,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TextField,
  ToggleChip,
} from "@/src/presentation/design-system";

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
  "taxExempt",
] as const satisfies readonly (keyof ProductFormInput)[];

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
    // A new product is live by default, matching the column — an operator who wants
    // to stage one unpublishes it deliberately.
    isPublished: product?.isPublished ?? true,
    badge: product?.badge ?? "",
    unit: product?.unit ?? "",
    description: product?.description ?? "",
    nutrition: product?.nutrition ?? "",
    origin: product?.origin ?? "",
    brand: product?.brand ?? "",
    dietary: product?.dietary ?? [],
    // A new product is exempt by default, matching the column — an operator opts a
    // product *in* to VAT deliberately.
    taxExempt: product?.taxExempt ?? true,
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
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  // Field errors arrive as `formErrors` keys — from the client resolver and the
  // API's `fieldErrors` alike — and resolve to copy here, at display time.
  const fieldError = (message?: string): string | undefined => formErrorMessage(tFormErrors, message);
  // Closed vocabulary stored as canonical English keys — the checkbox still submits
  // `tag`; only its label follows the admin's locale.
  const tDietary = useTranslations("dietary");
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
      if (!appliedField) setError("root", { message: localizeApiError(error, tApiErrors, t("formError")) });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {/* The shopper-facing copy is per-locale: the base row holds the source (English)
          text and the `fa` tab its optional translation. Everything below the tabs
          (price, stock, image, category…) is locale-independent, so it lives once on the
          base row. Both panels stay mounted (`forceMount`) so switching tabs never drops
          a value or hides a server-side field error. */}
      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base">{t("localeTabBase")}</TabsTrigger>
          <TabsTrigger value="fa">{t("localeTabFa")}</TabsTrigger>
        </TabsList>

        <TabsContent value="base" forceMount className="flex flex-col gap-5 pt-4 data-[state=inactive]:hidden">
          <p className="text-body-b10 text-muted-foreground">{t("baseTabDescription")}</p>

          <TextField label={t("nameLabel")} required error={fieldError(errors.name?.message)}>
            {(control) => <Input {...control} {...register("name")} dir="ltr" placeholder={t("namePlaceholder")} />}
          </TextField>

          <TextField label={t("unitLabel")} description={t("unitDescription")} error={fieldError(errors.unit?.message)}>
            {(control) => <Input {...control} {...register("unit")} dir="ltr" placeholder={t("unitPlaceholder")} />}
          </TextField>

          <TextField label={t("descriptionLabel")} description={t("descriptionHelp")} error={fieldError(errors.description?.message)}>
            {(control) => (
              <Textarea {...control} {...register("description")} dir="ltr" placeholder={t("descriptionPlaceholder")} />
            )}
          </TextField>

          <TextField label={t("nutritionLabel")} description={t("nutritionHelp")} error={fieldError(errors.nutrition?.message)}>
            {(control) => (
              <Textarea {...control} {...register("nutrition")} dir="ltr" placeholder={t("nutritionPlaceholder")} />
            )}
          </TextField>

          <TextField label={t("originLabel")} description={t("originHelp")} error={fieldError(errors.origin?.message)}>
            {(control) => (
              <Textarea {...control} {...register("origin")} dir="ltr" placeholder={t("originPlaceholder")} />
            )}
          </TextField>
        </TabsContent>

        <TabsContent value="fa" forceMount className="flex flex-col gap-5 pt-4 data-[state=inactive]:hidden">
          <p className="text-body-b10 text-muted-foreground">{t("translationDescription")}</p>

          <TextField label={t("nameLabel")} error={fieldError(errors.faName?.message)}>
            {(control) => <Input {...control} {...register("faName")} dir="rtl" placeholder={t("faNamePlaceholder")} />}
          </TextField>

          <TextField label={t("unitLabel")} description={t("unitDescription")} error={fieldError(errors.faUnit?.message)}>
            {(control) => <Input {...control} {...register("faUnit")} dir="rtl" placeholder={t("faUnitPlaceholder")} />}
          </TextField>

          <TextField
            label={t("descriptionLabel")}
            description={t("descriptionHelp")}
            error={fieldError(errors.faDescription?.message)}
          >
            {(control) => (
              <Textarea
                {...control}
                {...register("faDescription")}
                dir="rtl"
                placeholder={t("faDescriptionPlaceholder")}
              />
            )}
          </TextField>

          <TextField label={t("nutritionLabel")} description={t("nutritionHelp")} error={fieldError(errors.faNutrition?.message)}>
            {(control) => (
              <Textarea {...control} {...register("faNutrition")} dir="rtl" placeholder={t("faNutritionPlaceholder")} />
            )}
          </TextField>

          <TextField label={t("originLabel")} description={t("originHelp")} error={fieldError(errors.faOrigin?.message)}>
            {(control) => (
              <Textarea {...control} {...register("faOrigin")} dir="rtl" placeholder={t("faOriginPlaceholder")} />
            )}
          </TextField>
        </TabsContent>
      </Tabs>

      <Field error={fieldError(errors.categoryId?.message)}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              {t("categoryLabel")}
              <RequiredMark />
            </label>
            <Select
              id={id}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              {...register("categoryId")}
            >
              <option value="" disabled>
                {t("selectCategory")}
              </option>
              {props.categories.map((category) => (
                // `auto`: a category that has no translation yet falls back to its base
                // (Latin) name, which must not be reordered by the RTL control.
                <option key={category.id} value={category.id} dir="auto">
                  {category.name}
                </option>
              ))}
            </Select>
          </>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label={t("priceLabel")}
          required
          description={t("priceDescription")}
          error={fieldError(errors.price?.message)}
        >
          {(control) => (
            <Input {...control} {...register("price")} inputMode="decimal" placeholder={t("pricePlaceholder")} />
          )}
        </TextField>

        <TextField
          label={t("originalPriceLabel")}
          description={t("originalPriceDescription")}
          error={fieldError(errors.originalPrice?.message)}
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
        error={fieldError(errors.stockQuantity?.message)}
      >
        {(control) => (
          <Input {...control} {...register("stockQuantity")} inputMode="numeric" placeholder={t("stockPlaceholder")} />
        )}
      </TextField>

      <Field error={fieldError(errors.imageUrl?.message)}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              {t("imageLabel")}
              <RequiredMark />
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

      <TextField label={t("badgeLabel")} description={t("badgeDescription")} error={fieldError(errors.badge?.message)}>
        {(control) => <Input {...control} {...register("badge")} dir="ltr" placeholder={t("badgePlaceholder")} />}
      </TextField>

      <Field error={fieldError(errors.brand?.message)}>
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <>
            <label htmlFor={id} className="text-body-b7 text-input-foreground">
              {t("brandLabel")}
            </label>
            {/* Brands are Latin proper nouns, never translated, so the control reads LTR:
                under RTL the trailing punctuation in a name like "Pantry Co." jumps to
                the front (".Pantry Co"). */}
            <Select
              id={id}
              dir="ltr"
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              {...register("brand")}
            >
              <option value="" dir="auto">
                {t("noBrand")}
              </option>
              {PRODUCT_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>
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
                  <ToggleChip
                    key={tag}
                    pressed={checked}
                    onPressedChange={(pressed) =>
                      field.onChange(
                        pressed
                          ? [...(field.value ?? []), tag]
                          : (field.value ?? []).filter((item: string) => item !== tag),
                      )
                    }
                  >
                    {tDietary(tag)}
                  </ToggleChip>
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

      <Controller
        control={control}
        name="isPublished"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-card-md border border-border px-4 py-3">
            <div>
              <label htmlFor="isPublished" className="text-body-b7 text-input-foreground">
                {t("publishedLabel")}
              </label>
              <p className="text-body-b10 text-muted-foreground">{t("publishedDescription")}</p>
            </div>
            <Switch
              id="isPublished"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={t("publishedAria")}
            />
          </div>
        )}
      />

      <Controller
        control={control}
        name="taxExempt"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-card-md border border-border px-4 py-3">
            <div>
              <label htmlFor="taxExempt" className="text-body-b7 text-input-foreground">
                {t("taxExemptLabel")}
              </label>
              <p className="text-body-b10 text-muted-foreground">{t("taxExemptDescription")}</p>
            </div>
            <Switch
              id="taxExempt"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={t("taxExemptAria")}
            />
          </div>
        )}
      />

      {errors.root?.message && (
        <FormMessage size="md">{errors.root.message}</FormMessage>
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
