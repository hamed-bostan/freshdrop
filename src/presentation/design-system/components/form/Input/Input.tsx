"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";
import { baseFieldStyles } from "../shared/baseFieldStyles";
import { focusRing } from "../../shared/focusRing";

const inputVariants = cva(
  ["px-5", focusRing],
  {
    variants: {
      hasLeftElement: {
        true: "ps-10",
      },

      hasRightElement: {
        true: "pe-10",
      },
    },

    defaultVariants: {
      hasLeftElement: false,
      hasRightElement: false,
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof baseFieldStyles>,
    VariantProps<typeof inputVariants> {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  /** Classes applied to the `<input>` itself; `className` styles the wrapper. */
  inputClassName?: string;
  /**
   * Overlay content rendered inside the field wrapper as a sibling *after* the
   * `<input>` — e.g. a floating label that reacts to the input through `peer-*`
   * variants. The input always carries the `peer` class for exactly this.
   */
  children?: React.ReactNode;
}

/**
 * The pure text-field control: the styled `<input>` plus optional left/right
 * adornment slots. It owns no label, placeholder policy, or error state — those
 * are field-layer concerns (see `TextField`, `FloatingField`). Use it bare with
 * an `aria-label` for label-less fields such as search.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      size,
      variant,

      leftElement,
      rightElement,
      children,

      ...props
    },
    ref,
  ) => {
    const hasLeft = Boolean(leftElement);
    const hasRight = Boolean(rightElement);

    return (
      <div className={cn("relative w-full", className)}>
        {hasLeft && (
          <div className="pointer-events-none absolute start-3 top-1/2 z-20 -translate-y-1/2 text-icon-muted">
            {leftElement}
          </div>
        )}

        <input
          ref={ref}
          className={cn(
            "peer",
            baseFieldStyles({ size, variant }),
            inputVariants({
              hasLeftElement: hasLeft,
              hasRightElement: hasRight,
            }),
            inputClassName,
          )}
          {...props}
        />

        {hasRight && (
          <div className="absolute end-5 top-1/2 z-20 -translate-y-1/2 text-icon-muted">{rightElement}</div>
        )}

        {children}
      </div>
    );
  },
);

Input.displayName = "Input";
