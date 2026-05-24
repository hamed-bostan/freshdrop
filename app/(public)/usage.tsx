"use client";

import { Field, Input } from "@/src/presentation/design-system";
import { OTPInput } from "@/src/presentation/design-system/components/Input/OTPInput";
import { PasswordToggle } from "@/src/presentation/design-system/components/Input/password-toggle";
import { Textarea } from "@/src/presentation/design-system/components/Input/textarea";
import { Lock, Mail, Search } from "lucide-react";
import { useState } from "react";

export default function UsagePage() {
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);

  const hasError = otp.length === 4 && otp !== "1234";

  return (
    <div className="flex flex-col gap-4 p-10">
      <Input size="lg" leftElement={<Search size={20} />} rightElement={<Mail size={16} />} label="Email md" />
      <Input size="sm" placeholder="text sm" />

      <Textarea
        placeholder="Tell us about yourself..."
        className="h-40" // You can override height via className
      />

      <Field
        description="Enter the 4-digit code we sent to your phone."
        error={hasError ? "The code you entered is invalid." : undefined}
      >
        {({}) => (
          <Textarea
            placeholder="Tell us about yourself..."
            className="h-40" // You can override height via className
          />
        )}
      </Field>

      <Field description="Must be at least 8 characters">
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <Input
            id={id}
            label="Password"
            type={show ? "text" : "password"}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            leftElement={<Lock size={16} />}
            rightElement={<PasswordToggle show={show} setShow={setShow} />}
          />
        )}
      </Field>

      <Field
        description="Enter the 4-digit code we sent to your phone."
        error={hasError ? "The code you entered is invalid." : undefined}
      >
        {({ id, ariaDescribedBy, ariaInvalid }) => (
          <OTPInput length={4} onChange={setOtp} error={ariaInvalid} aria-describedby={ariaDescribedBy} />
        )}
      </Field>
    </div>
  );
}
