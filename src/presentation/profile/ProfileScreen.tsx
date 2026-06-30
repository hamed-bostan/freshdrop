import Image from "next/image";
import { User } from "lucide-react";
import type { User as UserEntity } from "@/src/domain/entities/User";
import { Icon } from "@/src/presentation/design-system";
import { ProfileMenuItem } from "./components/ProfileMenuItem";

interface ProfileMenuEntry {
  label: string;
  href: string;
}

const PROFILE_MENU: ProfileMenuEntry[] = [
  { label: "Your Profile", href: "/profile/details" },
  { label: "Manage Address", href: "/profile/addresses" },
  { label: "Payment Methods", href: "/profile/payment-methods" },
  { label: "My Orders", href: "/orders" },
  { label: "Favorites", href: "/favorites" },
  { label: "My Wallet", href: "/profile/wallet" },
  { label: "Support", href: "/profile/support" },
  { label: "Settings", href: "/profile/settings" },
];

interface ProfileScreenProps {
  user: UserEntity;
}

export default function ProfileScreen({ user }: ProfileScreenProps) {
  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      <header className="pt-5">
        <h1 className="text-center text-heading-h3 text-foreground">Profile</h1>
      </header>

      <div className="flex flex-col items-center gap-3">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-surface">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={`${user.name}'s profile photo`}
              width={96}
              height={96}
              className="size-full object-cover"
            />
          ) : (
            <Icon icon={User} className="size-12 text-icon-muted" />
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <p className="text-heading-h5 text-foreground">{user.name}</p>
          <p className="text-body-b6 text-muted-foreground">{user.phone}</p>
        </div>
      </div>

      <nav aria-label="Profile menu" className="flex flex-col gap-2">
        {PROFILE_MENU.map((item) => (
          <ProfileMenuItem key={item.href} label={item.label} href={item.href} />
        ))}
      </nav>
    </div>
  );
}
