import { focusRing } from "../shared/focusRing";

/**
 * The chip *shape* — size, radius, typography, focus — shared by every chip form
 * so single-select and multi-select chips stay one visual family.
 *
 * The selected/unselected colours are NOT here. They key off the underlying Radix
 * primitive's own `data-state`, and Radix spells that `checked`/`unchecked` for
 * RadioGroup but `on`/`off` for Toggle. Each spelling is written out literally
 * below rather than generated from a template, because Tailwind discovers classes
 * by scanning source text — an interpolated class name is never emitted.
 */
export const chipShapeStyles = [
  "flex h-10 cursor-pointer items-center justify-center rounded-full px-4 text-button-btn4 transition-colors",
  focusRing,
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

/** State colours for chips built on Radix RadioGroup (single-select). */
export const chipRadioStateStyles = [
  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  "data-[state=unchecked]:border data-[state=unchecked]:border-border data-[state=unchecked]:text-muted-foreground",
].join(" ");

/** State colours for chips built on Radix Toggle (multi-select / clearable). */
export const chipToggleStateStyles = [
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  "data-[state=off]:border data-[state=off]:border-border data-[state=off]:text-muted-foreground",
].join(" ");
