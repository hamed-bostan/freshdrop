"use client";

import * as React from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Icon, Switch } from "@/src/presentation/design-system";
import { rowCardClass } from "@/src/presentation/components/menu-row";

interface SettingToggleRowProps {
  icon: ComponentType<LucideProps>;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingToggleRow({ icon, label, checked, onCheckedChange }: SettingToggleRowProps) {
  const id = React.useId();

  return (
    <div className={rowCardClass}>
      <Icon icon={icon} size="sm" className="text-primary" />
      {/* `htmlFor` names the switch and lets a tap on the label toggle it. */}
      <label htmlFor={id} className="flex-1 text-body-b3 text-foreground">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
