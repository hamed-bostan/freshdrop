import { cn } from "@/src/lib/utils";

interface OnboardingDotsProps {
  count: number;
  activeIndex: number;
}

/** Progress indicator: active step is an elongated bar, the rest small dots. */
export function OnboardingDots({ count, activeIndex }: OnboardingDotsProps) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all",
            index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-border",
          )}
        />
      ))}
    </div>
  );
}
