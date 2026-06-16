"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { TextField, FloatingField, Input, Icon } from "@/src/presentation/design-system";

/**
 * <Input /> — the base text-field control, shown across the three labelling modes.
 * Static label and floating label come from the field wrappers; placeholder mode
 * uses the bare control with an aria-label.
 */
export function InputUsage() {
  const [staticValue, setStaticValue] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [floatingValue, setFloatingValue] = React.useState("");
  const [invalidEmail, setInvalidEmail] = React.useState("not-an-email");

  const emailError =
    invalidEmail.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invalidEmail)
      ? "Enter a valid email address."
      : undefined;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="mb-5 text-body-b11 text-primary">Static label:</p>
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={staticValue}
          onChange={(e) => setStaticValue(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-5 text-body-b11 text-primary">Placeholder (label-less — needs aria-label):</p>
        <Input
          type="search"
          placeholder="Search products"
          aria-label="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftElement={<Icon icon={Search} size="sm" className="text-icon-muted" />}
        />
      </div>

      <div>
        <p className="mb-5 text-body-b11 text-primary">Floating label:</p>
        <FloatingField
          label="Email"
          type="email"
          value={floatingValue}
          onChange={(e) => setFloatingValue(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-5 text-body-b11 text-primary">Error / validation:</p>
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={invalidEmail}
          onChange={(e) => setInvalidEmail(e.target.value)}
          error={emailError}
        />
      </div>
    </div>
  );
}
