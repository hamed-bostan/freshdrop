"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { baseFieldStyles } from "./baseFieldStyles";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const inputId = id ?? React.useId();

  return (
    <textarea
      id={inputId}
      className={cn(baseFieldStyles(), "p-3 h-32 resize-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}
