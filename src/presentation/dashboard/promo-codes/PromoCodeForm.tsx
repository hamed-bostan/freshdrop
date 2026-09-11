"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import {
  isoToEndDate,
  isoToStartDate,
  promoCodeFormSchema,
  type PromoCodeFormInput,
} from "@/src/contracts/promo-code-schema";
import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import { Link, useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import {
  Button,
  FormMessage,
  Input,
  Switch,
  TextField,
} from "@/src/presentation/design-system";

import { promoCodesApi } from "./promo-code-api";

/** Fields the API can return targeted `fieldErrors` for. */
const FORM_FIELDS = ["code", "title", "description", "discountPercent", "startsAt", "endsAt"] as const;

type PromoCodeFormProps = { mode: "create" } | { mode: "edit"; promoCode: AdminPromoCode };

/**
 * Create/edit promo-code form. React Hook Form + Zod (the shared
 * `promoCodeFormSchema`). The DS fields aren't `forwardRef`, so RHF's `register`
 * is spread onto `Input` via `TextField`'s render-prop. Submits over the REST API
 * via `promoCodesApi`; on success it navigates back to the list, and an `ApiError`
 * surfaces inline — field-specific messages on the offending fields (a taken code,
 * say), otherwise at the root.
 *
 * The window inputs are plain dates. `endsAt` is *inclusive* here — the last day
 * the code works — and the contract converts it to the exclusive instant the
 * domain stores, so an operator never has to think in half-open intervals.
 */
export function PromoCodeForm(props: PromoCodeFormProps) {
  const t = useTranslations("dashPromoCodes");
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  // Field errors arrive as `formErrors` keys — from the client resolver and the
  // API's `fieldErrors` alike — and resolve to copy here, at display time.
  const fieldError = (message?: string): string | undefined => formErrorMessage(tFormErrors, message);
  const editing = props.mode === "edit";
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PromoCodeFormInput>({
    resolver: zodResolver(promoCodeFormSchema, undefined, { raw: true }),
    defaultValues:
      props.mode === "edit"
        ? {
            code: props.promoCode.code,
            title: props.promoCode.title,
            description: props.promoCode.description,
            discountPercent: String(props.promoCode.discountPercent),
            active: props.promoCode.active,
            startsAt: isoToStartDate(props.promoCode.startsAt),
            // Back from the stored exclusive instant to the inclusive last day.
            endsAt: isoToEndDate(props.promoCode.endsAt),
          }
        : { code: "", title: "", description: "", discountPercent: "", active: true, startsAt: "", endsAt: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (props.mode === "edit") await promoCodesApi.update(props.promoCode.id, values);
      else await promoCodesApi.create(values);
      router.push("/dashboard/promo-codes");
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("formError") });
        return;
      }
      // Prefer field-level messages (e.g. a code already in use) so they read in
      // context; fall back to one root message when the API didn't scope the error.
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
      <TextField
        label={t("codeLabel")}
        required
        description={t("codeDescription")}
        error={fieldError(errors.code?.message)}
      >
        {(control) => (
          // LTR and upper-cased: the codes are Latin even on the Persian store,
          // and the use-case canonicalizes the spelling on save anyway.
          <Input
            {...control}
            {...register("code")}
            dir="ltr"
            inputClassName="uppercase"
            placeholder={t("codePlaceholder")}
          />
        )}
      </TextField>

      <TextField label={t("titleLabel")} required error={fieldError(errors.title?.message)}>
        {(control) => <Input {...control} {...register("title")} placeholder={t("titlePlaceholder")} />}
      </TextField>

      <TextField label={t("descriptionLabel")} required error={fieldError(errors.description?.message)}>
        {(control) => (
          <Input {...control} {...register("description")} placeholder={t("descriptionPlaceholder")} />
        )}
      </TextField>

      <TextField
        label={t("discountLabel")}
        required
        description={t("discountDescription")}
        error={fieldError(errors.discountPercent?.message)}
      >
        {(control) => (
          <Input
            {...control}
            {...register("discountPercent")}
            inputMode="numeric"
            dir="ltr"
            placeholder={t("discountPlaceholder")}
          />
        )}
      </TextField>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={t("startsAtLabel")}
          description={t("startsAtDescription")}
          error={fieldError(errors.startsAt?.message)}
        >
          {(control) => <Input {...control} {...register("startsAt")} type="date" dir="ltr" />}
        </TextField>

        <TextField
          label={t("endsAtLabel")}
          description={t("endsAtDescription")}
          error={fieldError(errors.endsAt?.message)}
        >
          {(control) => <Input {...control} {...register("endsAt")} type="date" dir="ltr" />}
        </TextField>
      </div>

      <Controller
        control={control}
        name="active"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-card-md border border-border px-4 py-3">
            <div>
              <label htmlFor="active" className="text-body-b7 text-input-foreground">
                {t("activeLabel")}
              </label>
              <p className="text-body-b10 text-muted-foreground">{t("activeDescription")}</p>
            </div>
            <Switch
              id="active"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label={t("activeAria")}
            />
          </div>
        )}
      />

      {/* The redemption count is read-only: it's a record of what happened, not a
          field. Shown here so the number an operator saw in the table is still in
          front of them while they decide whether to change the campaign. */}
      {props.mode === "edit" && (
        <p className="text-body-b10 text-muted-foreground">
          {t("usageSummary", { count: props.promoCode.usageCount })}
        </p>
      )}

      {errors.root?.message && <FormMessage size="md">{errors.root.message}</FormMessage>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {editing ? t("saveChanges") : t("createPromoCode")}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/promo-codes">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
