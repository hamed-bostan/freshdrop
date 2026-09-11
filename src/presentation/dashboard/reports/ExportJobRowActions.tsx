"use client";

import { Copy, Download, EllipsisVertical, RefreshCw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import type { ExportJob } from "@/src/domain/entities/ExportJob";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import {
  Button,
  ConfirmSheet,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIconTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Icon,
} from "@/src/presentation/design-system";

import { exportJobsApi } from "./export-job-api";

type ExportJobRowActionsProps = { job: ExportJob };

/**
 * A Recent-exports row's actions: a primary Download/Regenerate button sized
 * to what the row's status actually allows, plus an overflow menu (copy
 * link, regenerate, delete) that's always available.
 *
 * Download isn't a client fetch-then-save — it's a plain link to
 * `GET /api/admin/exports/jobs/[id]/download`, which itself 302s to a
 * freshly-minted signed URL (see that route). "Copy link" copies that same
 * app URL, not the signed one: the signed URL expires in five minutes and
 * would make a copied link stale almost immediately, where the app URL mints
 * a new one on every visit for as long as the job stays `ready`.
 */
export function ExportJobRowActions({ job }: ExportJobRowActionsProps) {
  const t = useTranslations("dashExportReports");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();

  const [regenerating, startRegenerate] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, startDelete] = React.useTransition();

  const downloadHref = `/api/admin/exports/jobs/${job.id}/download`;

  function handleRegenerate(): void {
    setError(null);
    startRegenerate(async () => {
      try {
        await exportJobsApi.regenerate(job);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? localizeApiError(err, tApiErrors, t("regenerateError")) : t("regenerateError"));
      }
    });
  }

  function handleCopyLink(): void {
    void navigator.clipboard?.writeText(`${window.location.origin}${downloadHref}`);
  }

  function handleDelete(): void {
    startDelete(async () => {
      try {
        await exportJobsApi.remove(job.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? localizeApiError(err, tApiErrors, t("deleteJobError")) : t("deleteJobError"));
      }
    });
  }

  const canRetry = job.status === "failed" || job.status === "expired";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        {job.status === "ready" ? (
          <Button asChild variant="outline" size="sm">
            <a href={downloadHref} download>
              <Icon icon={Download} size="xs" className="me-1.5" />
              {t("recentDownload")}
            </a>
          </Button>
        ) : canRetry ? (
          <Button variant="outline" size="sm" onClick={handleRegenerate} loading={regenerating}>
            {!regenerating && <Icon icon={RefreshCw} size="xs" className="me-1.5" />}
            {t("recentRegenerate")}
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuIconTrigger aria-label={t("recentRowActionsAria")}>
            <EllipsisVertical aria-hidden className="size-4" />
          </DropdownMenuIconTrigger>

          <DropdownMenuContent>
            {job.status === "ready" ? (
              <DropdownMenuItem onSelect={handleCopyLink}>
                <Copy aria-hidden className="size-4" />
                {t("recentCopyLink")}
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem onSelect={handleRegenerate} disabled={regenerating}>
              <RefreshCw aria-hidden className="size-4" />
              {t("recentRegenerate")}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => setDeleteOpen(true)} disabled={deleting} destructive>
              <Trash2 aria-hidden className="size-4" />
              {t("recentDelete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmSheet
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t("recentDeleteTitle")}
          message={t("recentDeleteMessage")}
          confirmLabel={t("recentDelete")}
          onConfirm={handleDelete}
        />
      </div>

      {error ? (
        <p role="status" className="text-body-b8 text-error-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
