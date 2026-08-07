import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/src/lib/utils";
import { Icon } from "@/src/presentation/design-system";

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
    <ol className="mx-auto flex w-full max-w-[650px] items-start px-2 py-1 sm:px-0">
      {CHECKOUT_STEPS.map((step, index) => {
        const isLast = index === CHECKOUT_STEPS.length - 1;
        const done = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step} className={cn("flex items-start", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={!done}
                onClick={() => onSelect(step)}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold sm:size-11 sm:text-base",
                  done && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !done && !isCurrent && "border-transparent bg-muted text-muted-foreground",
                  !done && "cursor-default",
                )}
              >
                {done ? <Icon icon={Check} size="sm" /> : index + 1}
              </button>
              <span
                className={cn("text-sm font-medium sm:text-base", done || isCurrent ? "text-primary" : "text-muted-foreground")}
              >
                {t(STEP_LABEL_KEYS[step])}
              </span>
            </div>
            {!isLast && (
              <span
                aria-hidden
                className={cn("mx-2 mt-[18px] h-px flex-1 sm:mx-5 sm:mt-[22px]", done ? "bg-primary" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
