import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  [
    "flex items-center justify-center",
    "px-4",
    "rounded-button-xl",
    "text-button-btn4",
    "transition-colors",
    "duration-200",
    "ease-out",
    "focus-visible:outline-none",
    "focus-visible:ring",
    "focus-visible:ring-ring",
    "disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground active:bg-primary-pressed disabled:bg-disabled disabled:text-disabled-foreground",
        outline:
          "border border-primary text-primary bg-transparent active:bg-accent active:text-primary-pressed active:border-primary-pressed disabled:border-disabled-border disabled:text-disabled-foreground",
        ghost: "px-0 bg-transparent text-foreground disabled:text-disabled-foreground",
        link: "px-0 bg-transparent text-primary disabled:text-disabled-foreground",
      },

      size: {
        sm: "h-10",
        md: "h-11",
        lg: "h-12",
      },

      iconOnly: {
        // shrink-0 keeps the square from being compressed by greedy flex
        // siblings (e.g. a w-full Input in the same row), which would squash
        // the width on the main axis and break the 1:1 aspect ratio.
        true: "p-0 shrink-0",
        false: "",
      },
    },

    compoundVariants: [
      { iconOnly: true, size: "sm", className: "size-10" },
      { iconOnly: true, size: "md", className: "size-11" },
      { iconOnly: true, size: "lg", className: "size-12" },
    ],

    defaultVariants: {
      variant: "primary",
      size: "md",
      iconOnly: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconOnly, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            iconOnly,
          }),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
