"use client";

import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/src/lib/utils";

import { focusRing } from "../../shared/focusRing";
import { baseFieldStyles } from "../shared/baseFieldStyles";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  Pick<VariantProps<typeof baseFieldStyles>, "variant">;

/**
 * Multi-line field control, sharing `baseFieldStyles` with `Input`/`Select` so it
 * reads as one field family (fill, border, disabled and `aria-invalid` states).
 *
 * It takes `variant` but deliberately NOT `size`: that axis sets a single-line
 * control's height, which is meaningless for a textarea. Height is a caller
 * concern — override the default with `rows` or `className`.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        baseFieldStyles({ variant }),
        "h-32 resize-none p-3",
        focusRing,
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
