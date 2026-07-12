"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/src/lib/utils";

/** Amber used for stars across the app (the `rating` design token). */
const STAR_COLOR_CLASS = "text-rating";

const starSizes = {
  sm: "size-5",
  md: "size-8",
  lg: "size-10",
} as const;

export interface RatingStarsProps {
  /** Current rating, 0–`max`. */
  value: number;
  /** Total number of stars. */
  max?: number;
  /** When provided, the stars become an interactive rating picker. */
  onChange?: (value: number) => void;
  /** Star size. */
  size?: keyof typeof starSizes;
  /** Accessible name for the interactive group (e.g. "Your rating"). */
  label?: string;
  className?: string;
}

/**
 * A row of `max` stars. Read-only by default; pass `onChange` to turn it into an
 * interactive rating picker (rendered as a radio group for keyboard + a11y).
 */
export function RatingStars({ value, max = 5, onChange, size = "md", label, className }: RatingStarsProps) {
  const t = useTranslations("ds");
  const groupLabel = label ?? t("ratingLabel");
  const stars = Array.from({ length: max }, (_, index) => index + 1);

  const star = (filled: boolean) => (
    <Star
      aria-hidden
      strokeWidth={1.5}
      className={cn(starSizes[size], STAR_COLOR_CLASS, filled ? "fill-rating" : "fill-transparent")}
    />
  );

  if (!onChange) {
    return (
      <div className={cn("flex items-center gap-1", className)} role="img" aria-label={t("ratingValue", { value, max })}>
        {stars.map((starValue) => (
          <span key={starValue}>{star(starValue <= value)}</span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)} role="radiogroup" aria-label={groupLabel}>
      {stars.map((starValue) => (
        <button
          key={starValue}
          type="button"
          role="radio"
          aria-checked={starValue === value}
          aria-label={t("ratingStar", { count: starValue })}
          onClick={() => onChange(starValue)}
          className="rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
        >
          {star(starValue <= value)}
        </button>
      ))}
    </div>
  );
}
