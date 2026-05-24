"use client";

import * as React from "react";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";
import { baseFieldStyles } from "./baseFieldStyles";
import { FloatingLabel } from "./FloatingLabel";

const inputVariants = cva(
  "px-5 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      hasLeftElement: {
        true: "pl-10",
      },

      hasRightElement: {
        true: "pr-10",
      },

      floating: {
        true: "placeholder:text-transparent",
      },
    },

    defaultVariants: {
      hasLeftElement: false,
      hasRightElement: false,
      floating: false,
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof baseFieldStyles>,
    VariantProps<typeof inputVariants> {
  label?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      size,

      leftElement,
      rightElement,

      label,
      id,
      placeholder,
      required,

      value,
      defaultValue,
      onChange,

      ...props
    },
    ref,
  ) => {
    const inputId = id ?? React.useId();

    const hasLeft = Boolean(leftElement);
    const hasRight = Boolean(rightElement);

    const [focused, setFocused] = React.useState(false);

    const [hasValue, setHasValue] = React.useState(Boolean(value ?? defaultValue));

    const floating = focused || hasValue;

    const effectivePlaceholder = label ? " " : placeholder;

    const floatingOffset = hasLeft ? "left-10" : "left-7";

    return (
      <div className={cn("relative w-full", className)}>
        {hasLeft && <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2">{leftElement}</div>}

        <input
          ref={ref}
          id={inputId}
          placeholder={effectivePlaceholder}
          required={required}
          value={value}
          defaultValue={defaultValue}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            setHasValue(e.currentTarget.value.length > 0);
          }}
          onChange={(e) => {
            setHasValue(e.currentTarget.value.length > 0);
            onChange?.(e);
          }}
          className={cn(
            baseFieldStyles({ size }),

            inputVariants({
              hasLeftElement: hasLeft,
              hasRightElement: hasRight,
              floating: Boolean(label),
            }),

            inputClassName,
          )}
          {...props}
        />

        {label && (
          <FloatingLabel
            id={inputId}
            label={label}
            required={required}
            floatingOffset={floatingOffset}
            floating={floating}
            focused={focused}
          />
        )}

        {hasRight && <div className="absolute right-5 top-1/2 z-20 -translate-y-1/2">{rightElement}</div>}
      </div>
    );
  },
);

Input.displayName = "Input";
