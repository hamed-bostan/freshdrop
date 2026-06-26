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
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result && "error" in result) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
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
        onOpenChange={setOpen}
        title="Delete category?"
        message={`"${name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirm}
      />
    </>
  );
}
