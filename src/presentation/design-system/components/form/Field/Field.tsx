"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

export type FieldProps = {
  id?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: (args: { id: string; ariaDescribedBy?: string; ariaInvalid?: boolean }) => React.ReactNode;
};

export const Field = ({ id, description, error, className, children }: FieldProps) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;

  const descriptionId = description ? `${fieldId}-desc` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {children({ id: fieldId, ariaDescribedBy, ariaInvalid: Boolean(error) })}

      {description && (
        <p id={descriptionId} className="text-body-b10 text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-body-b10 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
