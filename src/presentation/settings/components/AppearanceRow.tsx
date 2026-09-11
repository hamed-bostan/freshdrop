"use client";

import { SunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { MenuRow } from "@/src/presentation/components/menu-row";

import { PickerSheet } from "./PickerSheet";

type Appearance = "system" | "light" | "dark";

/**
 * Local-only appearance picker — there's no theme provider or dark-theme tokens
 * yet, so the choice isn't applied to the UI. Wiring this up to a real theme
 * switch is a follow-up; the row is built now so it isn't a dead end in Settings.
 */
export function AppearanceRow() {
  const t = useTranslations("settings");
  const [open, setOpen] = React.useState(false);
  const [appearance, setAppearance] = React.useState<Appearance>("system");

  const labels: Record<Appearance, string> = {
    system: t("appearanceSystem"),
    light: t("appearanceLight"),
    dark: t("appearanceDark"),
  };

  return (
    <>
      <MenuRow icon={SunMoon} label={t("appearance")} value={labels[appearance]} onClick={() => setOpen(true)} />

      <PickerSheet
        open={open}
        onOpenChange={setOpen}
        title={t("appearance")}
        value={appearance}
        onChange={(value) => setAppearance(value as Appearance)}
        options={(["system", "light", "dark"] as const).map((value) => ({ value, label: labels[value] }))}
      />
    </>
  );
}
