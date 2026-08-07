"use client";

import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/src/lib/utils";

import { focusRing } from "../../shared/focusRing";
import { baseFieldStyles } from "../shared/baseFieldStyles";

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> &
  VariantProps<typeof baseFieldStyles>;

/**
 * Dropdown control, sharing `baseFieldStyles` with `Input`/`Textarea` so it reads
 * as one field family (fill, border, sizing, disabled and `aria-invalid` states).
 *
 * Deliberately a native `<select>` rather than a Radix listbox: this app is
 * mobile-first, and the OS picker is both faster to operate on touch and better
 * at long option lists than anything rendered in-page. That also means the
 * browser draws the chevron — no `appearance-none` here.
 *
 * Options are passed as children; it owns no label, so wrap it in `<Field>`/
 * `<TextField>` or give it an `aria-label`.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, variant, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(baseFieldStyles({ size, variant }), "cursor-pointer px-3", focusRing, className)}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
