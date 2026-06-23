"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPen, Phone, MessageSquareText, type LucideIcon } from "lucide-react";
import { Button, Icon, TextField } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { ProfileAvatarUploader } from "./components/ProfileAvatarUploader";

const ICON = "text-icon-muted";

type ProfileForm = { firstName: string; lastName: string; phone: string; email: string };

/**
 * Field config drives both the rendered inputs and the form shape, so the two
 * can't drift apart. `type`/`inputMode` stay optional (default text input).
 */
const FIELDS: ReadonlyArray<{
  name: keyof ProfileForm;
  label: string;
  icon: LucideIcon;
  autoComplete: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}> = [
  { name: "firstName", label: "First name", autoComplete: "given-name", icon: UserPen },
  { name: "lastName", label: "Last name", autoComplete: "family-name", icon: UserPen },
  { name: "phone", label: "Phone", type: "tel", inputMode: "tel", autoComplete: "tel", icon: Phone },
  { name: "email", label: "Email", type: "email", autoComplete: "email", icon: MessageSquareText },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const [form, setForm] = React.useState<ProfileForm>({ firstName: "", lastName: "", phone: "", email: "" });

  const update = (key: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: wire to a SaveProfile use case once a User entity/repository exists.
    router.push("/profile");
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title="Complete Profile" />

      <div className="flex justify-center">
        <ProfileAvatarUploader />
      </div>

      <div className="flex flex-col gap-4">
        {FIELDS.map(({ name, label, icon, type, inputMode, autoComplete }) => (
          <TextField
            key={name}
            size="lg"
            label={label}
            placeholder={label}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            value={form[name]}
            onChange={update(name)}
            leftElement={<Icon icon={icon} size="sm" className={ICON} />}
          />
        ))}
      </div>

      <Button type="submit" size="lg" className="mt-auto w-full rounded-button-lg">
        Save &amp; Continue
      </Button>
    </form>
  );
}
