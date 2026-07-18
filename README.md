# FreshDrop

A production-grade grocery-delivery storefront and admin dashboard, built with Next.js (App Router) and TypeScript on a Clean Architecture core.

Customers browse a localized catalogue, build a cart, pick a delivery window and address on a map, pay from an in-app wallet, and track orders. Admins manage catalogue, orders, customers, reviews, and team access from a dedicated dashboard. The app is self-hosted: it ships as a Docker image to a single VPS behind nginx, with its own PostgreSQL.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Database & migrations](#database--migrations)
- [Internationalization](#internationalization)
- [Design system](#design-system)
- [Authentication & authorization](#authentication--authorization)
- [Testing & quality gates](#testing--quality-gates)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

**Storefront**

- Catalogue with categories, product detail pages, search, and favorites
- Cart with optimistic quantity steppers, promo codes, and checkout
- Delivery addresses with map-based placement (Leaflet) and reverse geocoding
- Delivery-window booking against capacity-limited slots
- In-app wallet: balance, saved cards, transaction history
- Order history, order detail, and tracking; back-in-stock alerts
- Onboarding, profile, settings, and support

**Admin dashboard** (`/dashboard`)

- Overview KPIs, orders and order detail, customers
- Category and product management, including image upload
- Review moderation
- Team access: role grants, ownership transfer, and an audited role-change log

**Platform**

- English/Persian localization with RTL, and USD→Toman price rendering
- Transactional SMS and email notifications for order and team events
- REST API surface (`/api/*`) consumed over HTTP by both browser and server code

---

## Tech stack

| Concern       | Choice                                               |
| ------------- | ---------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling       | Tailwind CSS v4 + generated design tokens            |
| UI primitives | Radix UI, `class-variance-authority`, Lucide icons   |
| Data          | Prisma 6 + PostgreSQL 17                             |
| Auth          | Auth.js (NextAuth) v5, phone OTP via SMS.ir          |
| Forms         | React Hook Form + Zod                                |
| HTTP          | Axios (shared browser and server-side clients)       |
| i18n          | next-intl                                            |
| Media         | Supabase Storage                                     |
| Maps          | Leaflet / react-leaflet, Nominatim geocoding         |
| Mail          | Nodemailer (SMTP)                                    |
| Runtime       | Node.js 24                                           |
| Delivery      | Docker, docker compose, nginx, GitHub Actions → GHCR |

---

## Architecture

The codebase follows **Clean Architecture**: dependencies point inward, and the domain is framework-free.

```
presentation ──┐
               ├──► domain (entities · use-cases · repository ports · errors)
infrastructure ┘        ▲
                        │ implemented by
              Prisma · Supabase · SMS · SMTP · mocks
```

- **`domain`** holds entities, use-cases, and repository _interfaces_. It imports no framework code, so business rules are testable in isolation.
- **`infrastructure`** provides concrete adapters (Prisma repositories, Supabase image storage, SMS/email notifiers, mocks). `infrastructure/container.ts` is the **sole composition root** — the only place interfaces are bound to implementations.
- **`presentation`** contains feature UI modules and the design system. Components hold no business logic.

### API & data flow (BFF)

The frontend treats the backend as a separate service and always talks to it over HTTP REST — never by calling a use-case or the database directly.

- **Route handlers** (`app/api/<resource>/route.ts`) are thin controllers: authenticate → validate with Zod → delegate to a use-case → map domain errors to HTTP. They return one envelope: the resource (or `204`) on success, `{ error: { message, code?, fieldErrors? } }` on failure.
- **Browser client** — one shared Axios instance (`src/lib/api/client.ts`) with `withCredentials`; a response interceptor normalizes every failure into an `ApiError` carrying `status`, `code`, and per-field `fieldErrors`.
- **Server client** — `src/lib/api/server-client.ts` resolves an absolute base URL and forwards request cookies, so Server Component renders behave like calls to a remote backend.
- **Typed services** — per-feature wrappers (`categoriesApi`, `productsServerApi`, …); components call those, never Axios directly.
- **Reads** — a Server Component fetches during render and passes plain data into a presentational screen. No first-paint spinner, no client fetch waterfall; the server is the single source of truth.
- **Mutations** — a client component calls the browser service, then `router.refresh()` re-runs the server render. Local copies of server data are never patched by hand.
- **Failures** — a failed server fetch surfaces through a route `error.tsx` boundary whose `reset()` retries the segment.

The **Categories** feature is the reference implementation of this pattern.

---

## Project structure

```
app/                      Next.js App Router
├── [locale]/
│   ├── (main)/           Storefront routes
│   ├── (protected)/      Admin dashboard
│   └── (dev)/            Internal component playgrounds
└── api/                  REST route handlers

src/
├── domain/               Entities, use-cases, repository ports, errors — framework-free
├── infrastructure/       Prisma/Supabase/SMS/email adapters, mocks, container.ts
├── presentation/         Feature UI modules + design-system/
├── lib/                  Cross-cutting helpers (api clients, auth guards, formatters)
├── i18n/                 Locale routing, request config, direction
├── config/               App configuration (currency, …)
└── shared/ · styles/ · types/

prisma/                   schema.prisma + migrations
messages/                 en.json · fa.json translation catalogues
deploy/                   systemd unit + timer for pull-based CD
nginx/                    Reverse-proxy configuration
scripts/                  One-off maintenance scripts
```

---

## Getting started

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- Docker (for the local PostgreSQL container)

### Setup

```bash
git clone https://github.com/hamed-bostan/freshdrop.git
cd freshdrop
npm ci
```

Create the two local env files:

- **`.env`** — read by _both_ Next.js and the Prisma CLI. It must contain `DATABASE_URL`.
- **`.env.local`** — read by Next.js only (secrets, feature toggles).

`.env`:

```dotenv
DATABASE_URL=postgresql://freshdrop:<password>@localhost:5432/freshdrop?schema=public
```

For `.env.local`, start from the documented keys in [`.env.production.example`](.env.production.example) — every variable is explained there — and set at minimum `AUTH_SECRET` and `ADMIN_USER_IDS`.

Start the database, apply migrations, and run the app:

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run dev
```

The app is served at `http://localhost:3000`.

> **Local sign-in:** without `SMS_IR_API_KEY` (or with `OTP_MOCK=true`) the app uses an in-memory OTP provider that logs the code server-side and surfaces it on the verify screen. Never enable this on a public deployment.

---

## Environment variables

[`.env.production.example`](.env.production.example) is the authoritative, fully commented reference. Summary:

| Variable                                                           | Required  | Purpose                                                         |
| ------------------------------------------------------------------ | --------- | --------------------------------------------------------------- |
| `DATABASE_URL`                                                     | ✅        | PostgreSQL connection string (Prisma)                            |
| `AUTH_SECRET`                                                      | ✅        | Auth.js JWT signing secret                                       |
| `ADMIN_USER_IDS`                                                   | ✅        | Comma-separated user ids allowed into `/dashboard`               |
| `SMS_IR_API_KEY`, `SMS_IR_TEMPLATE_ID`                             | ✅ (prod) | Real OTP delivery; unset falls back to the insecure mock          |
| `SMS_IR_*_TEMPLATE_ID`                                             |           | Per-event order and team notification templates                  |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅        | Supabase Storage (public values)                                 |
| `SUPABASE_SECRET_KEY`                                              | ✅        | Service-role key — **server-only, never expose**                 |
| `SUPABASE_IMAGES_BUCKET`                                           |           | Storage bucket name (default `images`)                           |
| `IMAGE_SWEEP_SECRET`, `IMAGE_SWEEP_MAX_AGE_HOURS`                  |           | Bearer secret + safety window for the orphan-image sweep         |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` |          | Invitation and notification email; unset ⇒ logged only           |
| `APP_URL`, `NEXT_PUBLIC_SITE_URL`                                  |           | Absolute origins for outbound links and SEO metadata             |
| `NEXT_PUBLIC_USD_TOMAN`, `EXCHANGE_RATE_URL`                       |           | Fixed and optional live USD→Toman rate                           |
| `NOMINATIM_USER_AGENT`, `NOMINATIM_BASE_URL`                       | ✅        | Geocoding identity and endpoint (public OSM requires a real UA)  |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`                | ✅ (prod) | Credentials for the bundled `db` container                       |
| `OTP_MOCK`                                                         |           | Forces the mock OTP provider — **development only**              |

---

## Scripts

| Script                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `npm run dev`             | Development server (regenerates design tokens first) |
| `npm run build`           | Production build — also type-checks the whole project |
| `npm start`               | Serve the production build                          |
| `npm run lint`            | ESLint (`eslint-config-next`, flat config)          |
| `npm run generate:tokens` | Regenerate design-system CSS from token definitions |
| `npm run db:generate`     | `prisma generate` (run from the project root only)  |
| `npm run db:migrate`      | Create and apply a development migration            |
| `npm run db:deploy`       | Apply pending migrations (production)               |
| `npm run db:seed:slots`   | Seed delivery windows                               |

---

## Database & migrations

Prisma with PostgreSQL 17. The schema covers catalogue (`Product`, `Category` and their translation tables), commerce (`Order`, `OrderItem`, `CartItem`, `PromoCode`), fulfilment (`DeliveryWindow`, `DeliverySlotBooking`, `DeliveryLocation`), money (`WalletAccount`, `WalletTransaction`, `WalletCard`, `PaymentMethod`), and identity (`User`, `RoleChange`, `Review`, `StockAlert`).

```bash
npm run db:migrate                                  # develop: create + apply
npm run db:migrate -- --name add_widget_table       # named migration
npm run db:deploy                                   # production: apply only
```

Migration SQL is pinned to LF via `.gitattributes` so checksums stay stable across platforms. If Prisma reports a migration was "modified after applied", reconcile the checksum in `_prisma_migrations` — do not reset the database.

---

## Internationalization

`next-intl` with catalogues in [`messages/`](messages) (`en`, `fa`).

Locale is a **user preference, not part of the URL** (`localePrefix: "never"`). The middleware resolves it from the persisted `NEXT_LOCALE` cookie — falling back to `accept-language`, then the default — and rewrites internally onto the `[locale]` segment. Switching writes the cookie and reloads, so the choice survives navigation _and_ the browser Back button. Persian renders RTL and displays prices in Toman.

---

## Design system

`src/presentation/design-system/` holds Radix-based components, icons, and design tokens. Tokens are the source of truth: `npm run generate:tokens` compiles them into CSS custom properties, and it runs automatically before `dev` and `build`. Styling is Tailwind v4 only, mobile-first, tokens over literal values.

---

## Authentication & authorization

- **Sign-in** is phone + OTP through a Credentials provider whose `authorize` delegates to the `VerifyOtp` use-case, keeping the rule in the domain. Sessions are JWT — no database adapter.
- **User id** is the phone number normalized to local form (`09xxxxxxxxx`).
- **Admin access** is granted by listing user ids in `ADMIN_USER_IDS`; `getAdminSession` guards dashboard routes and write endpoints. Public `GET`s are open; `POST`/`PUT`/`DELETE` require admin.
- **Never trust the client** — route handlers re-validate with the same Zod schema the form uses.
- `trustHost` is enabled because the app runs behind nginx rather than on Vercel.

---

## Testing & quality gates

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push and pull request to `main`:

1. `npm ci` on the Node version from `.nvmrc`
2. `npm run lint`
3. Docker image build — which runs `next build` and therefore type-checks the project

Pull requests build the image for validation; pushes to `main` also publish it to GHCR as `:production` and `:<sha>`.

---

## Deployment

Self-hosted on a single VPS, pull-based — CI never connects to the server.

```
push to main ──► GitHub Actions ──► ghcr.io/hamed-bostan/freshdrop:production
                                              │
                          systemd timer (~2 min) polls for a new digest
                                              ▼
                       VPS: docker compose pull && docker compose up -d
```

[`docker-compose.yml`](docker-compose.yml) runs three services on an internal bridge network:

- **`app`** — the Next.js image, health-checked over HTTP, reachable only inside the network
- **`db`** — `postgres:17-alpine` with a `pgdata` volume and a `pg_isready` health check; `app` waits for it
- **`nginx`** — the only service publishing ports (80/443), terminating TLS from Let's Encrypt certificates mounted read-only

Redeploys are handled by [`deploy/freshdrop-update.sh`](deploy/freshdrop-update.sh), driven by `freshdrop-update.timer`: it pulls the manifest, recreates containers only when the digest actually changed, and prunes superseded layers.

**Server setup checklist**

1. Place `docker-compose.yml`, `nginx/`, and `deploy/` under `/opt/freshdrop`.
2. Create `/opt/freshdrop/.env.production` from `.env.production.example` with real values (never committed).
3. Issue TLS certificates into `certbot/conf`.
4. Install and enable the systemd unit and timer from `deploy/`.
5. Apply migrations with `npm run db:deploy` against the running database.

---

## Contributing

Conventions are documented in [`CLAUDE.md`](CLAUDE.md) and enforced by review. In short:

- **Naming** — components `PascalCase`, hooks `useXxx`, folders `kebab-case`, constants `UPPER_SNAKE_CASE`
- **TypeScript** — strict, no `any`; prefer `type` over `interface` (reserve `interface` for declaration merging and extending library/DOM types)
- **Architecture** — respect the dependency direction; bind implementations only in `container.ts`
- **Components** — Server Components by default, `"use client"` only when needed; one component per file; no business logic in components
- **Data** — talk to the backend through typed Axios services, never Axios or the database directly
- **Styling** — Tailwind v4 and design tokens only; Radix for interactive elements
- **Errors** — handled explicitly, at the boundary that can act on them

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Run `npm run lint` and `npm run build` before opening a pull request.
