"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";
import { deleteCategory } from "./actions";

interface DeleteCategoryButtonProps {
  id: string;
  name: string;
}

/** Trash action that confirms via the DS ConfirmSheet, then deletes + refreshes. */
export function DeleteCategoryButton({ id, name }: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result && "error" in result) {
        // Re-open the sheet in a failure state so the error reads in context and
        // the user can retry — instead of a disruptive window.alert.
        setError(result.error);
        setOpen(true);
        return;
      }
      router.refresh();
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
