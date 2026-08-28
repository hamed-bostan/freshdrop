"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";

import { deliveryWindowsApi } from "./delivery-window-api";

type DeleteDeliveryWindowButtonProps = {
  id: string;
  label: string;
  trigger?: "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Trash action that confirms via the DS ConfirmSheet, then deletes over the API. */
export function DeleteDeliveryWindowButton({
  id,
  label,
  trigger = "button",
  open: controlledOpen,
  onOpenChange,
}: DeleteDeliveryWindowButtonProps) {
  const t = useTranslations("dashDeliverySlots");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await deliveryWindowsApi.remove(id);
        handleOpenChange(false);
        // Re-run the server render so the list reflects the delete — the server
        // stays the source of truth instead of patching local state.
        router.refresh();
      } catch (err) {
        // A refused delete (409 IN_USE) carries the server's own sentence naming
        // how many bookings are in the way and what to do about it — far more
        // useful than the generic "still in use", so it's shown verbatim. Every
        // other failure falls back to the localized copy.
        const message =
          err instanceof ApiError && err.code === "IN_USE"
            ? err.message
            : localizeApiError(err, tApiErrors, t("deleteError"));
        // Re-open the sheet in a failure state so the error reads in context.
        setError(message);
        handleOpenChange(true);
      }
    });
  }

  function handleOpenChange(next: boolean): void {
    setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) setError(null); // Drop a stale error once the sheet is dismissed.
  }

  return (
    <>
      {trigger === "button" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={t("deleteAria", { label })}
          onClick={() => handleOpenChange(true)}
          disabled={pending}
          className="text-destructive"
        >
          <Icon icon={Trash2} size="sm" />
        </Button>
      ) : null}

      <ConfirmSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={error ? t("deleteErrorTitle") : t("deleteTitle")}
        message={error ?? t("deleteMessage", { label })}
        confirmLabel={error ? t("deleteTryAgain") : t("deleteConfirm")}
        onConfirm={handleConfirm}
      />
    </>
  );
}
