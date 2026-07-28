"use client";

import * as React from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmSheet } from "@/src/presentation/design-system";
import { MenuRow } from "@/src/presentation/components/menu-row";
import { logout } from "@/src/presentation/auth/actions";

interface LogoutRowProps {
  icon: ComponentType<LucideProps>;
}

/** The destructive "Log out" row + its confirm sheet, isolated as a client island. */
export function LogoutRow({ icon }: LogoutRowProps) {
  const t = useTranslations("profile");
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <MenuRow icon={icon} label={t("logout")} tone="destructive" onClick={() => setOpen(true)} />

      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={t("logoutTitle")}
        message={t("logoutMessage")}
        confirmLabel={t("logoutConfirm")}
        cancelLabel={t("logoutCancel")}
        onConfirm={() => logout()}
      />
    </>
  );
}
