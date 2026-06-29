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
- No business logic in components — REST route handlers (`app/api/<resource>/route.ts`) are thin controllers: authenticate → validate (Zod) → delegate to a use-case → map domain errors to HTTP. Components never call use-cases or the DB directly; they talk to the API through a typed Axios service

### API & Data Fetching

The frontend treats the backend as a separate service: it communicates over HTTP REST (no direct in-process use-case calls from client code). The **Categories** feature is the reference implementation.

- **Full decoupling (BFF)** — the frontend never reads the data layer directly; it always goes over HTTP REST. Browser code uses the client Axios instance; Server Components use the server-side client, so even server renders behave like calls to a separate backend
- **Browser Axios client** — one shared instance in `src/lib/api/client.ts` (`baseURL` from `NEXT_PUBLIC_API_BASE_URL`, falling back to `/api`; `withCredentials` so the Auth.js session cookie is sent). A response interceptor normalizes every failure into an `ApiError` (`src/lib/api/ApiError.ts`) carrying `status`, optional `code`, and per-field `fieldErrors`
- **Server-side client** — `src/lib/api/server-client.ts` (`serverApiGet`) for Server Components: resolves an absolute base URL (`API_BASE_URL`, else derived from request headers) and forwards the request cookies. Server-only (imports `next/headers`). Failure normalization is shared with the browser client via `src/lib/api/normalizeAxiosError.ts`
- **Typed services** — per-feature wrappers around the endpoints; components call those, never Axios directly, and use `async/await`. Browser: e.g. `presentation/dashboard/categories/category-api.ts`. Server: e.g. `presentation/category/category-server-api.ts`
- **Route handlers** return one consistent envelope: the resource (or `204`) on success, `{ error: { message, code?, fieldErrors? } }` on failure. Server helpers live in `src/lib/api/responses.ts`. Status codes: `400` validation, `401` unauthorized, `404` not found, `409` conflict, `5xx` server
- **Auth** — public reads (`GET`); writes (`POST`/`PUT`/`DELETE`) require admin via `getAdminSession`. Re-validate with the *same* Zod schema the client form uses — never trust the client
- Client components own their fetch + loading/error/empty states (see `CategoriesScreen`); a successful mutation navigates with the router instead of a server redirect

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
