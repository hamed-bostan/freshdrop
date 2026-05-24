"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";
import { baseFieldStyles } from "./baseFieldStyles";

interface OTPInputProps {
  length?: number;
  onChange?: (code: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 4, onChange, error }: OTPInputProps) {
  const [values, setValues] = React.useState<string[]>(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const updateValue = (i: number, v: string) => {
    if (!/^[0-9]?$/.test(v)) return;

    const next = [...values];
    next[i] = v;
    setValues(next);

    onChange?.(next.join(""));

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

    setValues(filled);
    onChange?.(filled.join(""));

    const nextIndex = Math.min(next.length, length - 1);
    refs.current[nextIndex]?.focus();
  };

  useEffect(() => refs.current[0]?.focus(), []);

  return (
    <div onPaste={handlePaste} className="flex gap-4" role="group" aria-label="One-time password code">
      {values.map((v, i) => {
        const isFocused = focusedIndex === i;
        const isFilled = v.length > 0;
        const isError = Boolean(error && isFilled);

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
              isError && "border-destructive",
            )}
          />
        );
      })}
    </div>
  );
}
