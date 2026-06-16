"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";
import { baseFieldStyles } from "../shared/baseFieldStyles";

interface OTPInputProps {
  length?: number;
  /** Controlled value. Omit for uncontrolled — the component tracks its own digits. */
  value?: string;
  onChange?: (code: string) => void;
  /** Move focus to the first cell on mount. Off by default to avoid stealing focus. */
  autoFocus?: boolean;
  /** Applied to the group container, so a `Field` (or label) can reference it. */
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Description / error association (e.g. from `Field`) — placed on each cell. */
  "aria-describedby"?: string;
  /** Marks the field invalid: applied to every cell and drives the error styling. */
  "aria-invalid"?: boolean;
}

export function OTPInput({
  length = 4,
  value,
  onChange,
  autoFocus = false,
  id,
  "aria-label": ariaLabel = "One-time password code",
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: OTPInputProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string[]>(() => Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Controlled → derive cells from `value`; uncontrolled → use internal state.
  const values = isControlled ? Array.from({ length }, (_, i) => value[i] ?? "") : internal;

  const commit = (next: string[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next.join(""));
  };

  const updateValue = (i: number, v: string) => {
    if (!/^[0-9]?$/.test(v)) return;

    const next = [...values];
    next[i] = v;
    commit(next);

    if (v && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      if (values[i]) updateValue(i, "");
      else if (i > 0) refs.current[i - 1]?.focus();
      return;
    }

    if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    }

    if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").slice(0, length);

    if (!/^\d+$/.test(pasted)) return;

    const next = pasted.split("");
    const filled = [...values];

    next.forEach((digit, idx) => {
      filled[idx] = digit;
    });

    commit(filled);

    const nextIndex = Math.min(next.length, length - 1);
    refs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  return (
    <div
      id={id}
      onPaste={handlePaste}
      className="flex gap-4"
      role="group"
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {values.map((v, i) => {
        const isFocused = focusedIndex === i;

        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            maxLength={1}
            value={v}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid || undefined}
            onChange={(e) => updateValue(i, e.target.value)}
            onFocus={(e) => {
              setFocusedIndex(i);
              e.target.setSelectionRange(1, 1);
            }}
            onBlur={() => setFocusedIndex(null)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              baseFieldStyles(),
              "size-12 text-center text-2xl border-2 border-input",
              "transition-all duration-200",
              isFocused && "border-ring",
              ariaInvalid && "border-destructive",
            )}
          />
        );
      })}
    </div>
  );
}
