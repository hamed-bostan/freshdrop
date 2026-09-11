"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { logout } from "@/src/presentation/auth/actions";
import { MenuRow } from "@/src/presentation/components/menu-row";
import { ConfirmSheet } from "@/src/presentation/design-system";
import { profilesApi } from "@/src/presentation/profile/profile-api";

/** Destructive "Delete account" row: confirms, deletes the account, then signs out. */
export function DeleteAccountRow() {
  const t = useTranslations("settings");
  const [open, setOpen] = React.useState(false);

  async function handleDelete(): Promise<void> {
    await profilesApi.remove();
    await logout();
  }

  return (
    <>
      <MenuRow icon={Trash2} label={t("deleteAccount")} tone="destructive" onClick={() => setOpen(true)} />

      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={t("deleteAccountTitle")}
        message={t("deleteAccountMessage")}
        confirmLabel={t("deleteAccountConfirm")}
        cancelLabel={t("deleteAccountCancel")}
        onConfirm={handleDelete}
      />
    </>
  );
}
