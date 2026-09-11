"use client";

import * as React from "react";

import { TextField, FloatingField, PasswordInput } from "@/src/presentation/design-system";

/**
 * <PasswordInput /> — Input + show/hide toggle, shown across all three labelling
 * modes plus an error state. Static and floating come from the field wrappers via
 * their render-prop; placeholder mode uses the bare control with an aria-label.
 */
export function PasswordInputUsage() {
  const [staticValue, setStaticValue] = React.useState("");
  const [placeholderValue, setPlaceholderValue] = React.useState("");
  const [floatingValue, setFloatingValue] = React.useState("");
  const [shortPassword, setShortPassword] = React.useState("123");

  const passwordError =
    shortPassword.length > 0 && shortPassword.length < 8 ? "Use at least 8 characters." : undefined;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="mb-5 text-body-b11 text-primary">Static label:</p>
        <TextField label="Password">
          {(control) => (
            <PasswordInput
              {...control}
              placeholder="Your password"
              autoComplete="current-password"
              value={staticValue}
              onChange={(e) => setStaticValue(e.target.value)}
            />
          )}
        </TextField>
      </div>

      <div>
        <p className="mb-5 text-body-b11 text-primary">Placeholder (label-less — needs aria-label):</p>
        <PasswordInput
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          value={placeholderValue}
          onChange={(e) => setPlaceholderValue(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-5 text-body-b11 text-primary">Floating label:</p>
        <FloatingField label="Password">
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="current-password"
              value={floatingValue}
              onChange={(e) => setFloatingValue(e.target.value)}
            />
          )}
        </FloatingField>
      </div>

      <div>
        <p className="mb-5 text-body-b11 text-primary">Error / validation:</p>
        <TextField label="Password" error={passwordError}>
          {(control) => (
            <PasswordInput
              {...control}
              placeholder="Your password"
              autoComplete="new-password"
              value={shortPassword}
              onChange={(e) => setShortPassword(e.target.value)}
            />
          )}
        </TextField>
      </div>
    </div>
  );
}
