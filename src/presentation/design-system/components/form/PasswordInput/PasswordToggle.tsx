"use client";

import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Icon } from "@/src/presentation/design-system/components/Icon";

interface PasswordToggleProps {
  show: boolean;
  setShow: (v: boolean) => void;
  controls?: string;
}

export function PasswordToggle({ show, setShow, controls }: PasswordToggleProps) {
  const t = useTranslations("ds");

  return (
    <button
      type="button"
      aria-label={show ? t("hidePassword") : t("showPassword")}
      aria-pressed={show}
      aria-controls={controls}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setShow(!show)}
      className="flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon icon={show ? EyeOff : Eye} size="sm" />
    </button>
  );
}
