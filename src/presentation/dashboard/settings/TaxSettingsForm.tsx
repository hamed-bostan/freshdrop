"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Percent } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { taxSettingsFormSchema, type TaxSettingsFormInput } from "@/src/contracts/tax-settings-schema";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import { Button, FormMessage, Icon, Input, Switch, TextField } from "@/src/presentation/design-system";

import { taxSettingsApi } from "./tax-settings-api";

import type { TaxSettingsWire } from "./tax-settings-response-schema";

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
    <form onSubmit={onSubmit} noValidate aria-labelledby="tax-heading" className="overflow-hidden rounded-card-lg border border-border bg-surface">
      <div className="flex items-start gap-4 border-b border-border p-5 sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-card-md bg-accent text-primary">
          <Icon icon={Percent} size="sm" />
        </span>
        <div className="min-w-0">
        <h2 id="tax-heading" className="text-body-b4 text-foreground">{t("taxHeading")}</h2>
        <p className="mt-1 max-w-2xl text-body-b6 leading-relaxed text-muted-foreground">{t("taxDescription")}</p>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:items-end sm:p-6">
        <div className="w-full sm:max-w-60">
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
            <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-card-md border border-border bg-muted/30 px-4 py-3">
              <span className="text-body-b7 text-foreground">{t("enabledLabel")}</span>
              <Switch id="tax-enabled" checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
        {errors.root?.message && <FormMessage size="md">{errors.root.message}</FormMessage>}
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto sm:min-w-28">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
