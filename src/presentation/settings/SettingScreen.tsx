"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ConfirmSheet } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { logout } from "@/src/presentation/auth/actions";
import { SettingRow, SettingToggleRow } from "./components";

const NAV_ITEMS: { labelKey: "aboutApp" | "support"; href: string }[] = [
  { labelKey: "aboutApp", href: "/profile/settings/about" },
  { labelKey: "support", href: "/profile/support" },
];

export default function SettingScreen() {
  const t = useTranslations("settings");
  // Local UI state for now — persisting preferences needs a settings repo/use-case,
  // and "Dark mood" needs dark theme tokens + a theme provider before it has effect.
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-6 pb-10">
      <PageHeader title={t("title")} />
      <div className="flex flex-col gap-3">
        <SettingToggleRow label={t("notifications")} checked={notifications} onCheckedChange={setNotifications} />
        <SettingToggleRow label={t("darkMode")} checked={darkMode} onCheckedChange={setDarkMode} />
        {NAV_ITEMS.map((item) => (
          <SettingRow key={item.href} label={t(item.labelKey)} href={item.href} />
        ))}
        <SettingRow label={t("logout")} tone="destructive" onClick={() => setLogoutOpen(true)} />
      </div>

      <ConfirmSheet
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title={t("logoutTitle")}
        message={t("logoutMessage")}
        confirmLabel={t("logoutConfirm")}
        cancelLabel={t("logoutCancel")}
        onConfirm={handleLogout}
      />
    </div>
  );
}
