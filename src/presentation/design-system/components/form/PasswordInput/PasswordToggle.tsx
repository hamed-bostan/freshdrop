"use client";

import { Eye, EyeOff } from "lucide-react";
import { Icon } from "@/src/presentation/design-system/components/Icon";

interface PasswordToggleProps {
  show: boolean;
  setShow: (v: boolean) => void;
  controls?: string;
}

export function PasswordToggle({ show, setShow, controls }: PasswordToggleProps) {
  return (
    <button
      type="button"
      aria-label={show ? "Hide password" : "Show password"}
      aria-pressed={show}
      aria-controls={controls}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setShow(!show)}
      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon icon={show ? EyeOff : Eye} size="sm" />
    </button>
  );
}
