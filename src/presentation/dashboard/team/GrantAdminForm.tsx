"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, TextField } from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import { grantAdminSchema, type GrantAdminInput } from "./team-schema";
import { teamApi } from "./team-api";

/**
 * Grant admin access to a phone number. React Hook Form + Zod (shared
 * `grantAdminSchema`), submitting over the REST API via `teamApi`.
 *
 * There's no separate "invite sent / pending" state to render: the grant lands on
 * the account behind that phone immediately, and it can only be used by someone
 * who passes OTP on the number. So a successful submit just re-runs the server
 * render (`router.refresh()`) and the new member appears in the table.
 */
export function GrantAdminForm() {
  const t = useTranslations("dashTeam");
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GrantAdminInput>({
    resolver: zodResolver(grantAdminSchema, undefined, { raw: true }),
    defaultValues: { phone: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await teamApi.grant(values);
      reset();
      // The server stays the source of truth — re-render rather than splicing a
      // row into a local copy of the list.
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("grantError") });
        return;
      }
      const fieldMessage = error.fieldErrors?.phone;
      if (fieldMessage) setError("phone", { message: fieldMessage });
      else setError("root", { message: localizeApiError(error, tApiErrors, t("grantError")) });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-card-lg border border-border p-5"
    >
      <div>
        <h2 className="text-body-b4 text-foreground">{t("grantHeading")}</h2>
        <p className="mt-1 text-body-b6 text-muted-foreground">{t("grantDescription")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* TextField drops extra props when a render-prop control is used, so the
            row's sizing lives on a wrapper rather than on the field itself. */}
        <div className="sm:max-w-xs sm:flex-1">
          <TextField
            label={t("phoneLabel")}
            required
            error={formErrorMessage(tFormErrors, errors.phone?.message)}
          >
            {(control) => (
              <Input
                {...control}
                {...register("phone")}
                type="tel"
                dir="ltr"
                autoComplete="off"
                placeholder={t("phonePlaceholder")}
              />
            )}
          </TextField>
        </div>

        <Button type="submit" disabled={isSubmitting} className="sm:mt-7">
          {isSubmitting ? t("granting") : t("grantSubmit")}
        </Button>
      </div>

      {errors.root?.message && (
        <p role="alert" className="text-body-b6 text-destructive">
          {errors.root.message}
        </p>
      )}
    </form>
  );
}
