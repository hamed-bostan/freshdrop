import { LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";

import { focusRing, Icon } from "@/src/presentation/design-system";

interface LocateButtonProps {
  onClick: () => void;
}

/** Floating action button that recentres the map on the device's location. */
export function LocateButton({ onClick }: LocateButtonProps) {
  const t = useTranslations("addresses");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("useMyLocation")}
      className={
        "absolute bottom-6 end-4 z-[500] flex size-12 items-center justify-center rounded-full " +
        "bg-primary text-primary-foreground shadow-lg transition-colors active:bg-primary-pressed " +
        focusRing
      }
    >
      <Icon icon={LocateFixed} size="md" />
    </button>
  );
}
