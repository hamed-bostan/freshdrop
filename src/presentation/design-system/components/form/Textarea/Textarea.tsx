"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { baseFieldStyles } from "../shared/baseFieldStyles";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        baseFieldStyles(),
        "h-32 resize-none p-3 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
