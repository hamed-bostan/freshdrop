# Store App

## Mission

Production-grade e-commerce app. Clean Architecture, design system, best practices.

---

## Stack

Next.js (App Router) · TypeScript · Radix UI · Tailwind v4 · Swiper.js · NextAuth.js

---

## Rules

### Naming

- **Components**: `PascalCase` (`ProductCard.tsx`)
- **Hooks**: `useXxx` (`useCart.ts`)
- **Utils/Types**: `camelCase` / `PascalCase` (`formatPrice.ts`, `Product`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_CART_ITEMS`)
- **Folders**: `kebab-case` (`product-card/`)

### TypeScript

- Strict mode, no `any`
- Default to `type` for app code — entities, repository ports, unions, props. Reserve `interface` for declaration merging only: module/global augmentation (e.g. `src/types/*.d.ts` augmenting NextAuth's `Session`), and extending external library/DOM types where `extends` ergonomics genuinely help (e.g. design-system props extending React HTML attributes)
- All functions and components explicitly typed

### Architecture

- Clean Architecture: Entities → Use Cases → Adapters → Next.js
- Server Components default, `"use client"` only when needed
- No business logic in components

### File Structure

```
src/
├── app/          # Pages & layouts
├── features/     # Feature modules (components, hooks, types)
├── use-cases/    # Business logic
├── entities/     # Domain models
├── components/ui # Design system (Radix-based)
├── hooks/        # Shared custom hooks
├── lib/          # Config (auth, db)
├── utils/        # Pure utilities
└── types/        # Global types
```

### Styling

- Tailwind v4 only, mobile-first, design tokens

### Other

- Radix UI for all interactive elements
- Errors handled explicitly
- One component per file

---

## Claude Behavior

- **Never run the dev server**

---

## Current Focus

_What you're working on today._
