"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button, Icon, TextField, PasswordInput } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";

type PasswordField = "old" | "new" | "confirm";

// The three password inputs are identical apart from copy/autocomplete, so they
// come from one typed config; the Email field below differs and stays explicit.
const PASSWORD_FIELDS: { key: PasswordField; label: string; placeholder: string; autoComplete: string }[] = [
  { key: "old", label: "Old Password", placeholder: "Type password", autoComplete: "current-password" },
  { key: "new", label: "New Password", placeholder: "Enter your new password", autoComplete: "new-password" },
  { key: "confirm", label: "Confirm Password", placeholder: "Re-enter your new password", autoComplete: "new-password" },
];

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [passwords, setPasswords] = React.useState<Record<PasswordField, string>>({ old: "", new: "", confirm: "" });
  const [email, setEmail] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: validate (new === confirm + strength) and call a ChangePassword use-case
    // once auth exists. The email is the account's, typically read-only/prefilled.
    router.push("/profile/settings");
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title="Create New Password" />

      <div className="flex flex-col gap-4">
        {PASSWORD_FIELDS.map(({ key, label, placeholder, autoComplete }) => (
          <TextField key={key} label={label}>
            {(control) => (
              <PasswordInput
                {...control}
                size="lg"
                placeholder={placeholder}
                autoComplete={autoComplete}
                value={passwords[key]}
                onChange={(event) => setPasswords((prev) => ({ ...prev, [key]: event.target.value }))}
              />
            )}
          </TextField>
        ))}

        <TextField
          label="Email"
          size="lg"
          type="email"
          placeholder="Email"
          autoComplete="email"
          leftElement={<Icon icon={Mail} size="sm" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="mt-auto w-full">
        Update
      </Button>
    </form>
  );
}
