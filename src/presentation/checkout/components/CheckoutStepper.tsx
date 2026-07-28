import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

export type CheckoutStepId = "delivery" | "payment" | "review";

export const CHECKOUT_STEPS: readonly CheckoutStepId[] = ["delivery", "payment", "review"];

const STEP_LABEL_KEYS = {
  delivery: "stepDelivery",
  payment: "stepPayment",
  review: "stepReview",
} as const satisfies Record<CheckoutStepId, string>;

interface CheckoutStepperProps {
  current: CheckoutStepId;
  /** Jump back to an already-completed step; a step at or ahead of `current` isn't reachable. */
  onSelect: (step: CheckoutStepId) => void;
}

/**
 * Horizontal checkout progress — mirrors the visual language of the delivery
 * {@link TrackingStepper} (solid green = done, ringed = current, muted = ahead)
 * but laid out left-to-right for a 3-step wizard instead of a vertical timeline.
 * Only completed steps are clickable, so a shopper can correct an earlier
 * choice but can't skip ahead of what they haven't filled in yet.
 */
export function CheckoutStepper({ current, onSelect }: CheckoutStepperProps) {
  const t = useTranslations("checkout");
  const currentIndex = CHECKOUT_STEPS.indexOf(current);

  return (
    <ol className="flex w-full items-start">
      {CHECKOUT_STEPS.map((step, index) => {
        const isLast = index === CHECKOUT_STEPS.length - 1;
        const done = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step} className={cn("flex items-start", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={!done}
                onClick={() => onSelect(step)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-body-b7",
                  done && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  !done && !isCurrent && "border-icon-muted bg-background text-icon-muted",
                  !done && "cursor-default",
                )}
              >
                {done ? <Icon icon={Check} size="sm" /> : index + 1}
              </button>
              <span
                className={cn("text-body-b9", done || isCurrent ? "text-primary" : "text-muted-foreground")}
              >
                {t(STEP_LABEL_KEYS[step])}
              </span>
            </div>
            {!isLast && (
              <span
                aria-hidden
                className={cn("mx-2 mt-4 h-0.5 flex-1", done ? "bg-primary" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
