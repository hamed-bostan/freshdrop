import { cva } from "class-variance-authority";

export const baseFieldStyles = cva(
  [
    "w-full rounded-input-xl bg-input focus:bg-input-focus outline-none transition-colors",
    "text-input-foreground placeholder:text-input-placeholder",
    // Error state is driven by `aria-invalid` so it composes with <Field /> and
    // native form validation. The compound `aria-invalid:focus-visible` rule keeps
    // the destructive ring while the field is focused, overriding the focus ring.
    "aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:focus-visible:ring-destructive",
  ],
  {
    variants: {
      size: {
        md: "h-10 text-body-b6",
        lg: "h-12 text-body-b2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);
