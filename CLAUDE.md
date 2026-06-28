# Store App

## Mission

Production-grade e-commerce app. Clean Architecture, design system, best practices.

---

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · Radix UI · Prisma + PostgreSQL · Supabase Storage (images) · Auth.js v5 · React Hook Form + Zod · Swiper · Leaflet

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

- Clean Architecture — dependencies point inward: `domain` (entities, use-cases, repository ports) is framework-free; `infrastructure` and `presentation` depend on it, never the reverse
- `infrastructure/container.ts` is the sole composition root: it binds repository interfaces to concrete impls (Prisma / Supabase / mocks). Everything else depends on the interfaces
- Server Components default, `"use client"` only when needed
- No business logic in components — server actions (`presentation/<feature>/actions.ts`) validate, then delegate to use-cases

### File Structure

```
src/
├── domain/          # Entities, use-cases, repository ports (interfaces), errors — no framework imports
├── infrastructure/  # Adapter impls: Prisma + mock repos, Supabase, prisma client, container.ts
├── presentation/    # Feature UI modules + design-system/ (Radix-based)
├── lib/             # Cross-cutting config & helpers (auth, guards, slugify)
├── shared/          # Shared assets
├── styles/          # Global styles
└── types/           # Global types + module augmentation (*.d.ts)
app/                 # Next.js App Router (repo root) — route groups (main)/(protected)/(dev), api/
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
