"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPen, Phone, MessageSquareText, type LucideIcon } from "lucide-react";
import type { User } from "@/src/domain/entities/User";
import { Button, Icon, TextField } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { ApiError } from "@/src/lib/api/ApiError";
import { ProfileAvatarUploader } from "./components/ProfileAvatarUploader";
import { profilesApi } from "./profile-api";

const ICON = "text-icon-muted";

type ProfileForm = { firstName: string; lastName: string; phone: string; email: string };

/**
 * Field config drives both the rendered inputs and the form shape, so the two
 * can't drift apart. `type`/`inputMode` stay optional (default text input).
 * Phone is the sign-in identity, so it's shown read-only — it can't be edited here.
 */
const FIELDS: ReadonlyArray<{
  name: keyof ProfileForm;
  label: string;
  icon: LucideIcon;
  autoComplete: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  readOnly?: boolean;
}> = [
  { name: "firstName", label: "First name", autoComplete: "given-name", icon: UserPen },
  { name: "lastName", label: "Last name", autoComplete: "family-name", icon: UserPen },
  { name: "phone", label: "Phone", type: "tel", inputMode: "tel", autoComplete: "tel", icon: Phone, readOnly: true },
  { name: "email", label: "Email", type: "email", autoComplete: "email", icon: MessageSquareText },
];

/** Split a stored full name into first/last for the two-field form (rejoined on save). */
function splitName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1).trim() };
}

interface CompleteProfileScreenProps {
  user: User;
}

export default function CompleteProfileScreen({ user }: CompleteProfileScreenProps) {
  const router = useRouter();
  const { firstName, lastName } = splitName(user.name);
  const [form, setForm] = React.useState<ProfileForm>({
    firstName,
    lastName,
    phone: user.phone,
    email: user.email ?? "",
  });
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(user.avatarUrl);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = (key: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await profilesApi.update({
        name: [form.firstName, form.lastName].join(" ").trim(),
        email: form.email.trim(),
        avatarUrl,
      });
      // Re-run the server render so the profile page reflects the saved changes.
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save your profile. Please try again.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title="Complete Profile" />

      <div className="flex justify-center">
        <ProfileAvatarUploader value={avatarUrl} onChange={setAvatarUrl} />
      </div>

      <div className="flex flex-col gap-4">
        {FIELDS.map(({ name, label, icon, type, inputMode, autoComplete, readOnly }) => (
          <TextField
            key={name}
            size="lg"
            label={label}
            placeholder={label}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            readOnly={readOnly}
            disabled={readOnly}
            value={form[name]}
            onChange={update(name)}
            leftElement={<Icon icon={icon} size="sm" className={ICON} />}
          />
        ))}
      </div>

      {error ? <p className="text-body-b8 text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={saving} className="mt-auto w-full rounded-button-lg">
        {saving ? "Saving…" : "Save & Continue"}
      </Button>
    </form>
  );
}
