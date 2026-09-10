"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import { notificationTemplateFormSchema, type NotificationTemplateFormInput } from "@/src/contracts/notification-template-schema";
import {
  NOTIFICATION_TEMPLATE_CHANNEL,
  NOTIFICATION_TEMPLATE_VARS,
  type NotificationTemplateKind,
} from "@/src/domain/entities/NotificationTemplate";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import type { FormErrorsTranslator } from "@/src/lib/formErrorMessage";
import { render } from "@/src/lib/renderTemplate";
import { Button, FormMessage, Input, Textarea } from "@/src/presentation/design-system";


import { notificationTemplatesApi } from "./notification-template-api";

import type { NotificationTemplateWire } from "./notification-template-response-schema";

type NotificationTemplateRowProps = {
  kind: NotificationTemplateKind;
  /** The seeded row, or `undefined` if it was somehow never seeded — starts blank. */
  template?: NotificationTemplateWire;
  /** Sample values for the live preview — not real send data, just illustrative. */
  sampleVars: Record<string, string>;
};

/** Resolve a form error, including the dynamic `unknownVariable:NAME` issue the contract emits. */
function templateErrorMessage(t: FormErrorsTranslator, message: string | undefined): string | undefined {
  if (!message) return undefined;
  if (message.startsWith("unknownVariable:")) {
    return t("unknownVariable", { name: message.slice("unknownVariable:".length) });
  }
  return t.has(message as Parameters<FormErrorsTranslator>[0]) ? t(message as Parameters<FormErrorsTranslator>[0]) : message;
}

/**
 * One kind's editable copy: a form (title/subject depending on channel, plus
 * body) and a live preview rendered client-side from sample values — the
 * `{{VAR}}` typo a template author would otherwise only discover on a real
 * send.
 */
export function NotificationTemplateRow({ kind, template, sampleVars }: NotificationTemplateRowProps) {
  const t = useTranslations("dashNotificationTemplates");
  const tApiErrors = useTranslations("apiErrors");
  const tFormErrors = useTranslations("formErrors");
  const router = useRouter();
  const channel = NOTIFICATION_TEMPLATE_CHANNEL[kind];
  const vars = NOTIFICATION_TEMPLATE_VARS[kind];

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NotificationTemplateFormInput>({
    resolver: zodResolver(notificationTemplateFormSchema(kind)),
    defaultValues: {
      title: template?.title ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
    },
  });

  const watched = useWatch({ control });
  const previewTitle = channel === "push" ? render(watched.title ?? "", sampleVars) : null;
  const previewSubject = channel === "email" ? render(watched.subject ?? "", sampleVars) : null;
  const previewBody = render(watched.body ?? "", sampleVars);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await notificationTemplatesApi.update(kind, values);
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: t("saveError") });
        return;
      }
      const fieldError = error.fieldErrors?.title ?? error.fieldErrors?.subject ?? error.fieldErrors?.body;
      if (fieldError) {
        setError("root", { message: templateErrorMessage(tFormErrors, fieldError) });
      } else {
        setError("root", { message: localizeApiError(error, tApiErrors, t("saveError")) });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
      <p className="break-words rounded-card-md border border-border bg-surface px-4 py-3 text-body-b6 leading-relaxed text-muted-foreground lg:col-span-2">{t("variablesHint", { vars: vars.length ? vars.map((name) => `{{${name}}}`).join(", ") : "—" })}</p>

      <div className="flex min-w-0 flex-col gap-4">
      {channel === "push" ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${kind}-title`} className="text-body-b7 text-input-foreground">{t("titleLabel")}</label>
          <Input id={`${kind}-title`} {...register("title")} aria-invalid={!!errors.title} inputClassName="h-11 sm:h-10" />
          {errors.title?.message && <FormMessage size="sm">{templateErrorMessage(tFormErrors, errors.title.message)}</FormMessage>}
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${kind}-subject`} className="text-body-b7 text-input-foreground">{t("subjectLabel")}</label>
          <Input id={`${kind}-subject`} {...register("subject")} aria-invalid={!!errors.subject} inputClassName="h-11 sm:h-10" />
          {errors.subject?.message && (
            <FormMessage size="sm">{templateErrorMessage(tFormErrors, errors.subject.message)}</FormMessage>
          )}
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={`${kind}-body`} className="text-body-b7 text-input-foreground">{t("bodyLabel")}</label>
        <Textarea id={`${kind}-body`} {...register("body")} aria-invalid={!!errors.body} rows={6} />
        {errors.body?.message && <FormMessage size="sm">{templateErrorMessage(tFormErrors, errors.body.message)}</FormMessage>}
      </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h4 className="text-body-b7 text-input-foreground">{t("previewHeading")}</h4>
        <div className="flex min-w-0 flex-1 flex-col gap-3 break-words rounded-card-md border border-border bg-surface p-4 sm:p-5">
          {previewTitle != null && <p className="text-body-b7 font-medium text-foreground">{previewTitle}</p>}
          {previewSubject != null && <p className="text-body-b7 font-medium text-foreground">{previewSubject}</p>}
          <p className="whitespace-pre-wrap text-body-b6 text-muted-foreground">{previewBody}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
      {errors.root?.message && <FormMessage size="md">{errors.root.message}</FormMessage>}
      <Button type="submit" className="w-full text-body-b7 sm:w-auto sm:min-w-28" loading={isSubmitting}>
        {isSubmitting ? t("saving") : t("save")}
      </Button>

      </div>
    </form>
  );
}
