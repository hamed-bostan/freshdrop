"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { categoriesApi } from "./category-api";

type DeleteCategoryButtonProps = {
  id: string;
  name: string;
};

/** Trash action that confirms via the DS ConfirmSheet, then deletes over the API. */
export function DeleteCategoryButton({ id, name }: DeleteCategoryButtonProps) {
  const t = useTranslations("dashCategories");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await categoriesApi.remove(id);
        setOpen(false);
        // Re-run the server render so the list reflects the delete — the server
        // stays the source of truth instead of patching local state.
        router.refresh();
      } catch (err) {
        // Re-open the sheet in a failure state so the error reads in context and
        // the user can retry — instead of a disruptive window.alert.
        const message = err instanceof ApiError ? err.message : t("deleteError");
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
        aria-label={t("deleteAria", { name })}
        onClick={() => setOpen(true)}
        disabled={pending}
        className="text-destructive"
      >
        <Icon icon={Trash2} size="sm" />
      </Button>

      <ConfirmSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={error ? t("deleteErrorTitle") : t("deleteTitle")}
        message={error ?? t("deleteMessage", { name })}
        confirmLabel={error ? t("deleteTryAgain") : t("deleteConfirm")}
        onConfirm={handleConfirm}
      />
    </>
  );
}
