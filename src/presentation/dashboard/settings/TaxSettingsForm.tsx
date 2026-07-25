"use client";

import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormMessage, Input, Switch, TextField } from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import { taxSettingsFormSchema, type TaxSettingsFormInput } from "@/src/contracts/tax-settings-schema";
import type { TaxSettingsWire } from "./tax-settings-response-schema";
import { taxSettingsApi } from "./tax-settings-api";

type TaxSettingsFormProps = {
  /** The current row, fetched over the BFF during server render. */
  settings: TaxSettingsWire;
};

/**
 * The store's VAT rate. React Hook Form + Zod (shared `taxSettingsFormSchema`),
 * submitting over the REST API via `taxSettingsApi`.
 *
 * Ships behind `enabled` off by default (see the schema default and the row's
 * column default) — nothing in checkout reads this yet, so saving here is safe
 * ahead of the phases that make it matter.
 */
export function TaxSettingsForm({ settings }: TaxSettingsFormProps) {
  const t = useTranslations("dashSettings");
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaxSettingsFormInput>({
    resolver: zodResolver(taxSettingsFormSchema, undefined, { raw: true }),
    defaultValues: { ratePercent: String(settings.ratePercent), enabled: settings.enabled },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await taxSettingsApi.update(values);
      // The server stays the source of truth — re-render rather than holding a
      // local copy of the row.
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("saveError") });
        return;
      }
      const message = error.fieldErrors?.ratePercent;
      if (message) {
        setError("ratePercent", { message });
      } else {
        setError("root", { message: localizeApiError(error, tApiErrors, t("saveError")) });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-card-lg border border-border p-5">
      <div>
        <h2 className="text-body-b4 text-foreground">{t("taxHeading")}</h2>
        <p className="mt-1 text-body-b6 text-muted-foreground">{t("taxDescription")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="sm:w-40">
          <TextField
            label={t("rateLabel")}
            required
            error={formErrorMessage(tFormErrors, errors.ratePercent?.message)}
          >
            {(control) => (
              <Input
                {...control}
                {...register("ratePercent")}
                type="number"
                min={0}
                max={100}
                step={0.1}
                dir="ltr"
              />
            )}
          </TextField>
        </div>

        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <label className="flex items-center gap-3 sm:mt-7">
              <Switch id="tax-enabled" checked={field.value} onCheckedChange={field.onChange} />
              <span className="text-body-b7 text-foreground">{t("enabledLabel")}</span>
            </label>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="sm:mt-7">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>

      {errors.root?.message && <FormMessage size="md">{errors.root.message}</FormMessage>}
    </form>
  );
}
