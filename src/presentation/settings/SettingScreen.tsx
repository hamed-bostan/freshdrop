"use client";

import * as React from "react";
import { Bell, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { MenuRow, SectionLabel } from "@/src/presentation/components/menu-row";
import { AppearanceRow, LanguageRow, SettingToggleRow } from "./components";
import { DeleteAccountRow } from "./components/DeleteAccountRow";

export default function SettingScreen() {
  const t = useTranslations("settings");
  // Local UI state — persisting this needs a settings repo/use-case (no backend yet).
  const [notifications, setNotifications] = React.useState(true);

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title={t("title")} />

      <div className="flex flex-col gap-2">
        <SectionLabel>{t("sectionPreferences")}</SectionLabel>
        <SettingToggleRow icon={Bell} label={t("notifications")} checked={notifications} onCheckedChange={setNotifications} />
        <LanguageRow />
        <AppearanceRow />
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>{t("sectionPrivacy")}</SectionLabel>
        <MenuRow icon={Lock} label={t("privacyPreferences")} href="/profile/settings/privacy" />
        <DeleteAccountRow />
      </div>
    </div>
  );
}
