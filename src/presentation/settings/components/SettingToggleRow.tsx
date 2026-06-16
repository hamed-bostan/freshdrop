"use client";

import * as React from "react";
import { Switch } from "@/src/presentation/design-system";
import { settingCardClass } from "./settingRowStyles";

interface SettingToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingToggleRow({ label, checked, onCheckedChange }: SettingToggleRowProps) {
  const id = React.useId();

  return (
    <div className={settingCardClass}>
      {/* `htmlFor` names the switch and lets a tap on the label toggle it. */}
      <label htmlFor={id} className="text-body-b3 text-foreground">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
