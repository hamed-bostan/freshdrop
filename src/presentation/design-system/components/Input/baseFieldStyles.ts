import { cva } from "class-variance-authority";

export const baseFieldStyles = cva("w-full rounded-md bg-input text-foreground outline-none transition-colors", {
  variants: {
    size: {
      lg: "h-12 text-base",
      md: "h-10 text-sm",
      sm: "h-8 text-sm",
    },
  },
  defaultVariants: {
    size: "md",
  },
});
