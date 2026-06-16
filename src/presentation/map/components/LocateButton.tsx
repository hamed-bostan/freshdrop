import { LocateFixed } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

interface LocateButtonProps {
  onClick: () => void;
}

/** Floating action button that recentres the map on the device's location. */
export function LocateButton({ onClick }: LocateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Use my current location"
      className={
        "absolute bottom-6 right-4 z-[500] flex size-12 items-center justify-center rounded-full " +
        "bg-primary text-primary-foreground shadow-lg transition-colors active:bg-primary-pressed " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }
    >
      <Icon icon={LocateFixed} size="md" />
    </button>
  );
}
