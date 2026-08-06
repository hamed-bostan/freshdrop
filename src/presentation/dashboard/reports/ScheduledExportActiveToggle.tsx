"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Switch } from "@/src/presentation/design-system";
import { scheduledExportsApi } from "./scheduled-export-api";

type Props = { id: string; active: boolean };

/**
 * The Scheduled reports panel's Active toggle — a plain `Switch`, unlike the
 * promo-code equivalent's confirm sheet: pausing a report schedule has no
 * customer-facing effect the moment it flips, just a missed run next time
 * it's due, so a stray click costs nothing a re-click doesn't undo.
 */
export function ScheduledExportActiveToggle({ id, active }: Props) {
  const t = useTranslations("dashScheduledExports");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleChange(next: boolean): void {
    setError(null);
    startTransition(async () => {
      try {
        await scheduledExportsApi.setActive(id, next);
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("toggleError")));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Switch checked={active} onCheckedChange={handleChange} disabled={pending} aria-label={t("activeAria")} />
      {error && (
        <p role="status" className="text-body-b10 text-error-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
