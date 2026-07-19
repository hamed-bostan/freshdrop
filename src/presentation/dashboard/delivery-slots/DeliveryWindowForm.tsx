"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { Button, FormMessage, Input, TextField } from "@/src/presentation/design-system";
import { Link, useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formErrorMessage } from "@/src/lib/formErrorMessage";
import { slugify } from "@/src/lib/slugify";
import {
  deliveryWindowFormSchema,
  minutesToTime,
  newDeliveryWindowSchema,
  type NewDeliveryWindowFormInput,
} from "@/src/contracts/delivery-window-schema";
import { deliveryWindowsApi } from "./delivery-window-api";

/** Fields the API can return targeted `fieldErrors` for. */
const FORM_FIELDS = ["id", "label", "startTime", "endTime", "capacity", "position"] as const;

type DeliveryWindowFormProps = { mode: "create" } | { mode: "edit"; window: DeliveryWindow };

/**
 * Create/edit delivery-window form. React Hook Form + Zod (the shared
 * `newDeliveryWindowSchema` / `deliveryWindowFormSchema`). Submits over the REST
 * API via `deliveryWindowsApi`; on success it navigates back to the list, and an
 * `ApiError` surfaces inline — field-specific messages on the offending fields,
 * otherwise at the root.
 *
 * One form component for both modes, with the id field present only when creating:
 * the slug is referenced by the booking ledger and by every order that booked the
 * window, so it's authored once and immutable after that. The two schemas differ
 * by exactly that field, which is why the resolver is chosen per mode rather than
 * the id being conditionally validated inside one schema.
 */
export function DeliveryWindowForm(props: DeliveryWindowFormProps) {
  const t = useTranslations("dashDeliverySlots");
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
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewDeliveryWindowFormInput>({
    resolver: zodResolver(editing ? deliveryWindowFormSchema : newDeliveryWindowSchema, undefined, {
      raw: true,
    }),
    defaultValues:
      props.mode === "edit"
        ? {
            id: props.window.id,
            label: props.window.label,
            startTime: minutesToTime(props.window.startMinutes),
            endTime: minutesToTime(props.window.endMinutes),
            capacity: String(props.window.capacity),
            position: String(props.window.position),
          }
        : { id: "", label: "", startTime: "", endTime: "", capacity: "", position: "" },
  });

  // Mirror the label into the slug until the user edits the slug directly. Only
  // when creating — an existing window's slug is fixed.
  const [slugLocked, setSlugLocked] = React.useState(editing);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (props.mode === "edit") await deliveryWindowsApi.update(props.window.id, values);
      else await deliveryWindowsApi.create(values);
      router.push("/dashboard/delivery-slots");
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("formError") });
        return;
      }
      // Prefer field-level messages (e.g. a slug already in use) so they read in
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
        label={t("labelLabel")}
        required
        description={t("labelDescription")}
        error={fieldError(errors.label?.message)}
      >
        {(control) => (
          <Input
            {...control}
            {...register("label", {
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                if (!slugLocked) setValue("id", slugify(event.target.value), { shouldValidate: true });
              },
            })}
            placeholder={t("labelPlaceholder")}
          />
        )}
      </TextField>

      {/* Creation only: the slug is what bookings and placed orders reference, so
          it can never be edited afterwards. The edit form doesn't send it at all. */}
      {!editing && (
        <TextField
          label={t("idLabel")}
          required
          description={t("idDescription")}
          error={fieldError(errors.id?.message)}
        >
          {(control) => (
            <Input
              {...control}
              {...register("id", { onChange: () => setSlugLocked(true) })}
              dir="ltr"
              placeholder={t("idPlaceholder")}
            />
          )}
        </TextField>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label={t("startLabel")} required error={fieldError(errors.startTime?.message)}>
          {(control) => <Input {...control} {...register("startTime")} type="time" dir="ltr" />}
        </TextField>

        <TextField label={t("endLabel")} required error={fieldError(errors.endTime?.message)}>
          {(control) => <Input {...control} {...register("endTime")} type="time" dir="ltr" />}
        </TextField>
      </div>

      <TextField
        label={t("capacityLabel")}
        required
        description={t("capacityDescription")}
        error={fieldError(errors.capacity?.message)}
      >
        {(control) => (
          <Input
            {...control}
            {...register("capacity")}
            inputMode="numeric"
            dir="ltr"
            placeholder={t("capacityPlaceholder")}
          />
        )}
      </TextField>

      <TextField
        label={t("positionLabel")}
        required
        description={t("positionDescription")}
        error={fieldError(errors.position?.message)}
      >
        {(control) => (
          <Input
            {...control}
            {...register("position")}
            inputMode="numeric"
            dir="ltr"
            placeholder={t("positionPlaceholder")}
          />
        )}
      </TextField>

      {errors.root?.message && <FormMessage size="md">{errors.root.message}</FormMessage>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {editing ? t("saveChanges") : t("createWindow")}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/delivery-slots">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
