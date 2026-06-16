"use client";

import * as React from "react";
import { Field, Input } from "@/src/presentation/design-system";

/**
 * <Field /> — the headless accessibility wrapper used internally by `TextField`
 * and `FloatingField`. Use it directly to give description + error + aria wiring
 * to any custom control. It generates the `id` and the `aria-describedby` /
 * `aria-invalid` attributes and hands them to the control via a render prop; the
 * control's error ring is driven by `aria-invalid`, so it lights up automatically.
 */
export function FieldUsage() {
  const [email, setEmail] = React.useState("");
  const error = email.length > 0 && !email.includes("@") ? "Enter a valid email address." : undefined;

  return (
    <Field description="We'll only use this to send your receipt." error={error}>
      {({ id, ariaDescribedBy, ariaInvalid }) => (
        <Input
          id={id}
          type="email"
          aria-label="Email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        />
      )}
    </Field>
  );
}
