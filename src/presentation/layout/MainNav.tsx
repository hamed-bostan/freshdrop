"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User, type LucideIcon } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { useCart } from "@/src/presentation/cart/CartProvider";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/category", label: "Category", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/profile", label: "Profile", icon: User },
];

/** Focused task flows (forms, onboarding) hide the bottom nav for a distraction-free view. */
const HIDE_NAV_ON_PREFIXES = [
  "/cart/promo",
  "/profile/details",
  "/profile/addresses",
  "/profile/payment-methods",
  "/profile/settings",
  "/profile/support",
  "/profile/wallet",
  "/favorites",
  "/onboarding",
];

export function MainNav () {
  const pathname = usePathname();
  // The badge reads the shared cart store, so it updates optimistically the moment
  // an item is added/removed anywhere — grid, detail page or the cart itself.
  const cartCount = useCart().cart.itemCount;

  if (HIDE_NAV_ON_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav
      aria-label="Main navigation"
      className="max-w-md mx-auto fixed bottom-0 left-0 right-0 z-50 min-h-20 grid grid-cols-4 border-t border-border bg-background overflow-hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        // The Cart tab carries a count badge so an add elsewhere gives visible confirmation.
        const showCount = href === "/cart" && cartCount > 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            aria-label={showCount ? `${label}, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : undefined}
            className={cn(
              "relative flex h-full flex-col items-center justify-center gap-1",
              isActive ? "text-primary" : "text-foreground",
            )}
          >
            {isActive && (
              <span aria-hidden className="absolute inset-x-4 top-0 -translate-y-1/2 h-1 rounded-full bg-primary" />
            )}
            <span className="relative">
              <Icon icon={icon} size="sm" />
              {showCount && (
                <span
                  aria-hidden
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-label-l3 font-semibold text-primary-foreground"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            <span className={cn("text-body-b6", isActive && "font-semibold")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
