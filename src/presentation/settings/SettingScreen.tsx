"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ConfirmSheet } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SettingRow, SettingToggleRow } from "./components";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Change password", href: "/profile/settings/change-password" },
  { label: "About application", href: "/profile/settings/about" },
  { label: "Support", href: "/profile/support" },
];

export default function SettingScreen() {
  const router = useRouter();

  // Local UI state for now — persisting preferences needs a settings repo/use-case,
  // and "Dark mood" needs dark theme tokens + a theme provider before it has effect.
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);

  const handleLogout = () => {
    // TODO: clear the session via an auth use-case once auth exists.
    router.push("/");
  };

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-6 pb-10">
      <PageHeader title="Setting" />
      <div className="flex flex-col gap-3">
        <SettingToggleRow label="Notifications" checked={notifications} onCheckedChange={setNotifications} />
        <SettingToggleRow label="Dark mood" checked={darkMode} onCheckedChange={setDarkMode} />
        {NAV_ITEMS.map((item) => (
          <SettingRow key={item.href} label={item.label} href={item.href} />
        ))}
        <SettingRow label="Logout" tone="destructive" onClick={() => setLogoutOpen(true)} />
      </div>

      <ConfirmSheet
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Are you sure you want to Log out?"
        message="Thank You And See You Again!"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
      />
    </div>
  );
}
