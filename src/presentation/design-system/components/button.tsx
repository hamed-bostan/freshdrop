"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "flex items-center justify-center whitespace-nowrap font-medium transition-colors" +
    " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" +
    " disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
        success: "bg-success text-success-foreground hover:bg-success-hover active:bg-success-active",
        destructive:
          "border border-destructive text-destructive bg-transparent hover:bg-destructive-hover active:bg-destructive-active",
        outline: "border border-input bg-transparent hover:bg-muted hover:text-foreground",
        ghost: "bg-transparent hover:bg-muted hover:text-foreground",
        link: "bg-transparent p-0 h-auto underline-offset-4 hover:underline text-primary",
      },
      size: {
        lg: "h-12 px-6 gap-2 rounded-md",
        md: "h-10 px-6 gap-1 rounded-md text-base",
        sm: "h-6 px-[10px] gap-1 rounded-sm text-xs",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const iconSizeMap = {
  lg: "size-6",
  md: "size-5",
  sm: "size-[14px]",
  icon: "size-5",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, leftIcon, rightIcon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const hasOnlyIcon = !!((leftIcon || rightIcon) && !children);
    const finalSize: keyof typeof iconSizeMap = hasOnlyIcon ? "icon" : ((size as keyof typeof iconSizeMap) ?? "md");
    const defaultIconSize = iconSizeMap[finalSize];

    function renderIcon(iconNode?: React.ReactNode) {
      if (!iconNode || !React.isValidElement(iconNode)) return null;

      const element = iconNode as React.ReactElement<{ className?: string }>;
      const existingClass = element.props.className ?? "";

      const hasExplicitSize =
        existingClass.includes("size-") || existingClass.includes("w-") || existingClass.includes("h-");

      return React.cloneElement(element, {
        className: cn("shrink-0", !hasExplicitSize && defaultIconSize, existingClass),
      });
    }

    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size: finalSize }), className)} {...props}>
        <span className="flex items-center justify-center gap-[inherit]">
          {renderIcon(leftIcon)}
          {children}
          {renderIcon(rightIcon)}
        </span>
      </Comp>
    );
  },
);

Button.displayName = "Button";
