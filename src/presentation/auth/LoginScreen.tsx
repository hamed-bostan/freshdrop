"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button, Icon, TextField } from "@/src/presentation/design-system";
import { requestOtp } from "./actions";

export default function LoginScreen({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setPending(true);

    const result = await requestOtp(phone);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    // Carry the phone (and any callbackUrl) to the verification step.
    const params = new URLSearchParams({ phone });
    if (callbackUrl && callbackUrl !== "/") params.set("callbackUrl", callbackUrl);
    router.push(`/login/verify?${params.toString()}`);
  };

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-10">
      <header className="pt-16 text-center mb-16">
        <h1 className="text-heading-h3 text-foreground mb-2">Welcome Back!</h1>
        <p className="text-body-b4 text-muted-foreground">Enter Your Phone Number To Access Your Account</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 min-h-28">
          <TextField
            label="Phone number"
            size="lg"
            type="tel"
            inputMode="tel"
            placeholder="Phone number"
            autoComplete="tel"
            required
            leftElement={<Icon icon={Phone} size="sm" />}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          {error && (
            <p role="alert" className="text-body-b10 text-destructive">
              {error}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={pending} className="mt-auto">
          {pending ? "Sending code…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
