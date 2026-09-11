"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, routing, type Locale } from "@/src/i18n/routing";
import { MenuRow } from "@/src/presentation/components/menu-row";

import { PickerSheet } from "./PickerSheet";

// Each language is labelled with its own endonym (its name in its own script), the
// industry-standard convention — a reader can always recognise their language
// regardless of the UI's current locale. Not routed through the message catalog for
// that reason: "English" stays "English" and "فارسی" stays "فارسی" under either locale.
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fa: "فارسی",
};

/**
 * Settings row that switches the app locale. Locale is a persisted preference, not
 * part of the URL (`localePrefix: "never"`): writing the `NEXT_LOCALE` cookie and
 * doing a full reload makes the server re-render the current URL — and, because the
 * client router cache is discarded, every later Back/Forward target too — in the
 * chosen locale. That is what makes the choice stick across the Back button, which a
 * soft (in-app) navigation cannot do: App Router restores prior pages from its
 * client cache without re-consulting the cookie. A reload on a (rare) language
 * change is the industry-standard trade for guaranteed correctness. `<html
 * lang/dir>`, the font and the message catalog all follow.
 */
export function LanguageRow() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);

  function handleChange(next: string): void {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    window.location.reload();
  }

  return (
    <>
      <MenuRow icon={Globe} label={t("language")} value={LOCALE_NAMES[locale]} onClick={() => setOpen(true)} />

      <PickerSheet
        open={open}
        onOpenChange={setOpen}
        title={t("language")}
        value={locale}
        onChange={handleChange}
        options={routing.locales.map((option) => ({ value: option, label: LOCALE_NAMES[option] }))}
      />
    </>
  );
}
