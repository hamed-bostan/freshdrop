"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";
import { ApiError } from "@/src/lib/api/ApiError";
import { categoriesApi } from "./category-api";

type DeleteCategoryButtonProps = {
  id: string;
  name: string;
  /** Called once the category is deleted, so the list can drop the row. */
  onDeleted: () => void;
};

/** Trash action that confirms via the DS ConfirmSheet, then deletes over the API. */
export function DeleteCategoryButton({ id, name, onDeleted }: DeleteCategoryButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await categoriesApi.remove(id);
        onDeleted();
      } catch (err) {
        // Re-open the sheet in a failure state so the error reads in context and
        // the user can retry — instead of a disruptive window.alert.
        const message =
          err instanceof ApiError ? err.message : "Couldn't delete the category. Please try again.";
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
        aria-label={`Delete ${name}`}
        onClick={() => setOpen(true)}
        disabled={pending}
        className="text-destructive"
      >
        <Icon icon={Trash2} size="sm" />
      </Button>

      <ConfirmSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={error ? "Couldn't delete category" : "Delete category?"}
        message={error ?? `"${name}" will be permanently removed. This can't be undone.`}
        confirmLabel={error ? "Try again" : "Delete"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
