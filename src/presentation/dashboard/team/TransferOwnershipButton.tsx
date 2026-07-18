"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { teamApi } from "./team-api";

type TransferOwnershipButtonProps = {
  id: string;
  name: string;
  /** True when this is the viewer's own row — claiming the seat, not handing it over. */
  isSelf: boolean;
};

/**
 * Hand ownership of the store to another member, behind a confirmation.
 *
 * The confirmation copy spells out that the caller steps down to admin, because
 * this is the one action on the page that removes power from the person taking
 * it — and it can't be undone from this side afterwards: only the new owner can
 * transfer it back.
 */
export function TransferOwnershipButton({ id, name, isSelf }: TransferOwnershipButtonProps) {
  const t = useTranslations("dashTeam");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await teamApi.transferOwnership(id);
        setOpen(false);
        // Re-run the server render: the caller is an admin now, so the team page
        // stops being theirs to manage and the server is what says so.
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("transferError")));
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
        aria-label={isSelf ? t("claimAria") : t("transferAria", { name })}
        title={isSelf ? t("claimAria") : t("transferAria", { name })}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        <Icon icon={Crown} size="sm" />
      </Button>

      <ConfirmSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={error ? t("transferErrorTitle") : isSelf ? t("claimTitle") : t("transferTitle")}
        message={error ?? (isSelf ? t("claimMessage") : t("transferMessage", { name }))}
        confirmLabel={
          error ? t("transferTryAgain") : isSelf ? t("claimConfirm") : t("transferConfirm")
        }
        onConfirm={handleConfirm}
      />
    </>
  );
}
