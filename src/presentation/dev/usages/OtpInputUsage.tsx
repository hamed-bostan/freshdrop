"use client";

import * as React from "react";
import { Field, OTPInput } from "@/src/presentation/design-system";

/**
 * <OTPInput /> — segmented one-time-code field, wrapped in <Field/> for
 * description + error + validation a11y, exactly like the other controls. Field
 * generates the wiring; OTPInput applies `aria-describedby` to its cells and
 * drives its error styling from `aria-invalid`.
 */
export function OtpInputUsage() {
  const expected = "123456";
  const [code, setCode] = React.useState("");

  const isComplete = code.length === expected.length;
  const isWrong = isComplete && code !== expected;

  return (
    <Field
      description={
        isComplete && !isWrong ? "Code verified ✓" : `Enter the ${expected.length}-digit code (try ${expected}).`
      }
      error={isWrong ? "That code is incorrect." : undefined}
    >
      {({ id, ariaDescribedBy, ariaInvalid }) => (
        <OTPInput
          id={id}
          length={expected.length}
          onChange={setCode}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        />
      )}
    </Field>
  );
}
