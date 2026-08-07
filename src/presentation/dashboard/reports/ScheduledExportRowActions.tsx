"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Link, useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";

import { scheduledExportsApi } from "./scheduled-export-api";

type Props = { id: string };

/** A schedule row's actions on the `/schedules` management list: edit, and delete-with-confirm. */
export function ScheduledExportRowActions({ id }: Props) {
  const t = useTranslations("dashScheduledExports");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, startDelete] = React.useTransition();

  function handleDelete(): void {
    setError(null);
    startDelete(async () => {
      try {
        await scheduledExportsApi.remove(id);
        router.refresh();
      } catch (err) {
        // `ConfirmSheet` already closed itself on the confirm click — reopen it
        // in a failure state so the error reads in context and the action can
        // be retried, same as `PromoCodeActiveToggle`.
        setError(localizeApiError(err, tApiErrors, t("deleteError")));
        setOpen(true);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/reports/exports/schedules/${id}/edit`}>
          <Icon icon={Pencil} size="xs" className="me-1.5" />
          {t("edit")}
        </Link>
      </Button>

      <Button variant="ghost" size="sm" iconOnly aria-label={t("delete")} onClick={() => setOpen(true)} disabled={deleting} className="text-destructive">
        <Icon icon={Trash2} size="xs" />
      </Button>

      <ConfirmSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        title={error ? t("deleteErrorTitle") : t("deleteTitle")}
        message={error ?? t("deleteMessage")}
        confirmLabel={error ? t("tryAgain") : t("delete")}
        onConfirm={handleDelete}
      />
    </div>
  );
}
