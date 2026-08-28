"use client";

import { Power, PowerOff } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, ConfirmSheet, Icon } from "@/src/presentation/design-system";

import { promoCodesApi } from "./promo-code-api";

type PromoCodeActiveToggleProps = {
  id: string;
  code: string;
  active: boolean;
  trigger?: "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Row action that switches a campaign on or off, confirming through the DS
 * ConfirmSheet first.
 *
 * This is the promo-code equivalent of the categories' delete button, and it
 * confirms for the same reason even though it's reversible: switching a live code
 * off is immediately visible to every shopper holding it. It's deliberately not a
 * bare `Switch` — a toggle that fires on a stray click, with no sentence saying
 * what will happen, is the wrong control for an action customers feel at once.
 */
export function PromoCodeActiveToggle({
  id,
  code,
  active,
  trigger = "button",
  open: controlledOpen,
  onOpenChange,
}: PromoCodeActiveToggleProps) {
  const t = useTranslations("dashPromoCodes");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const open = controlledOpen ?? internalOpen;

  function setOpen(next: boolean): void {
    if (controlledOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await promoCodesApi.setActive(id, !active);
        setOpen(false);
        // Re-run the server render so the row's status badge reflects the change —
        // the server stays the source of truth instead of patching local state.
        router.refresh();
      } catch (err) {
        // Re-open the sheet in a failure state so the error reads in context and
        // the action can be retried.
        setError(localizeApiError(err, tApiErrors, t("toggleError")));
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
      {trigger === "button" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={active ? t("deactivateAria", { code }) : t("activateAria", { code })}
          onClick={() => setOpen(true)}
          disabled={pending}
          className={active ? "text-destructive" : "text-success-foreground"}
        >
          <Icon icon={active ? PowerOff : Power} size="sm" />
        </Button>
      ) : null}

      <ConfirmSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={error ? t("toggleErrorTitle") : active ? t("deactivateTitle") : t("activateTitle")}
        message={error ?? (active ? t("deactivateMessage", { code }) : t("activateMessage", { code }))}
        confirmLabel={error ? t("tryAgain") : active ? t("deactivateConfirm") : t("activateConfirm")}
        onConfirm={handleConfirm}
      />
    </>
  );
}
