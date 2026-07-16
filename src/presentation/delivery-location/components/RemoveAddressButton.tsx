"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { deliveryLocationsApi } from "../delivery-location-api";

type RemoveAddressButtonProps = {
  id: string;
  label: string;
};

/** Trash action that confirms via the DS ConfirmSheet, then removes the address over the API. */
export function RemoveAddressButton({ id, label }: RemoveAddressButtonProps) {
  const t = useTranslations("addresses");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await deliveryLocationsApi.remove(id);
        setOpen(false);
        // Re-run the server render so the list reflects the delete — the server
        // stays the source of truth instead of patching local state.
        router.refresh();
      } catch (err) {
        // Re-open the sheet in a failure state so the error reads in context and
        // the user can retry — instead of a disruptive window.alert.
        const message = localizeApiError(err, tApiErrors, t("removeError"));
        setError(message);
        setOpen(true);
      }
    });
  }

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) setError(null); // Drop a stale error once the sheet is dismissed.
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={t("removeAria", { label })}
        onClick={() => setOpen(true)}
        disabled={pending}
        className="text-destructive"
      >
        <Icon icon={Trash2} size="sm" />
      </Button>

      <ConfirmSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={error ? t("removeErrorTitle") : t("removeTitle")}
        message={error ?? t("removeMessage", { label })}
        confirmLabel={error ? t("removeTryAgain") : t("removeConfirm")}
        onConfirm={handleConfirm}
      />
    </>
  );
}
