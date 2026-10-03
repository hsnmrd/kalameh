# کلمه | Kalameh Monorepo

Multi-tenant Language Learning & Institute Management SaaS Platform.

## 🏗 Architecture & Stack

- **Turborepo** + **pnpm workspaces**
- **Apps:**
  - `apps/api`: NestJS REST API with Prisma, Redis lock manager, I18n translation service, and JWT/HttpOnly cookie auth.
  - `apps/admin-panel`: Next.js App Router dashboard (Multi-language `fa`/`en`, RTL/LTR, Vazirmatn & Geist fonts).
  - `apps/student-pwa`: Next.js Mobile-first PWA (Multi-language `fa`/`en`, RTL/LTR, max-w-480px touch-first).
- **Packages:**
  - `packages/database`: Prisma schema, migrations, and seed scripts.
  - `packages/types`: Shared Zod schemas, inferred types, and `as const` roles/permissions.
  - `packages/ui`: Shared design system (Tailwind CSS v4 + Base UI / shadcn/ui).

---

## 📋 Implemented Modules & Completed Tasks

| PRD / Module                             | Description                                                                                                                                                                                                                                               | Status                      | Reference                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| **PRD_00_base (Foundation & Auth Base)** | Multi-Tenant Architecture, Shared Zod Types, Design System (`packages/ui`), NestJS Auth & RBAC, HttpOnly Cookie Authentication, Collocated Sibling Component Architecture, and End-to-End Internationalization (`Accept-Language` header + Backend i18n). | ✅ **Completed & Verified** | [`docs/implements/PRD_00_base.md`](./docs/implements/PRD_00_base.md) |

### Key Implemented Capabilities:

- [x] **Multi-Tenant Foundation:** Tenant resolution via subdomains/headers with strict database tenant isolation (`where: { instituteId }`).
- [x] **Centralized Type Safety (`@workspace/types`):** Shared Zod schemas for auth, users, institutes, roles, and permissions (`ROLES`, `PERMISSIONS`).
- [x] **Design System (`@workspace/ui`):** Touch-first controls (`h-14`, `rounded-2xl`), accessible `PasswordInput`, `Field`, and `Button` with loading states.
- [x] **Backend Auth & RBAC (`apps/api`):** Secure `httpOnly` JWT cookies, `JwtAuthGuard`, `RolesGuard`, and `UsersModule`.
- [x] **End-to-End Internationalization (i18n):** `next-intl` path routing (`/fa`, `/en`), language preference cookie memorization, automatic frontend `Accept-Language` header propagation, and NestJS `I18nService` with Persian (`fa`) and English (`en`) translation dictionaries.
- [x] **Admin Dashboard (`apps/admin-panel`):** Role-tailored dashboard (`SUPER_ADMIN` vs `INSTITUTE_ADMIN`), split 50/50 desktop login, accessible language switcher, and sidebar navigation with user badge.
- [x] **Student PWA (`apps/student-pwa`):** Mobile-first UI frame (`max-w-[480px]`), touch-optimized login, classes, enrollments, flashcards, and profile views.
- [x] **Collocated Sibling Architecture:** Named route folders with collocated `components/` and `hooks/`, and App Router grouping `({page})` for root index pages.

---

## 🚀 Getting Started in Development Mode

### 1. Prerequisites

- **Node.js**: `>= 20.x`
- **pnpm**: `>= 10.x` (`corepack enable pnpm`)
- **Docker & Docker Compose**

### 2. Environment Configuration

Copy the example environment file into `.env` at the root of the project:

```bash
cp .env.example .env
```

> **Note on Port Configurations:**
>
> - **PostgreSQL** runs on host port **`5433`** (`5433:5432`)
> - **Redis** runs on host port **`6380`** (`6380:6379`)
>   This prevents port collisions if you have other local PostgreSQL (5432) or Redis (6379) instances running.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Start Infrastructure (Docker)

Start PostgreSQL and Redis containers in the background:

```bash
docker compose up -d
```

To verify container health:

```bash
docker compose ps
```

### 5. Run Database Migrations & Seed Sample Data

Generate the Prisma client, apply database migrations, and seed sample testing users:

```bash
pnpm run db:generate
pnpm run db:migrate:dev
pnpm run db:seed
```

### 6. Start Development Servers

Start all monorepo applications concurrently:

```bash
pnpm dev
```

---

## 🌐 Applications & URLs

| Application     | URL                     | Role / Description                                                |
| --------------- | ----------------------- | ----------------------------------------------------------------- |
| **Admin Panel** | `http://localhost:3000` | Desktop dashboard for Super Admins, Institute Admins, and Clerks. |
| **Backend API** | `http://localhost:3001` | NestJS RESTful API & Swagger / Health endpoints.                  |
| **Student PWA** | `http://localhost:3002` | Mobile-first portal for students.                                 |

---

## 👤 Sample Seed Accounts

All seed accounts use the default password: **`Password123!`**

| Role                | Phone Number  | Subdomain    | Description                                                 |
| ------------------- | ------------- | ------------ | ----------------------------------------------------------- |
| **Super Admin**     | `09120000001` | _(Optional)_ | Platform superuser with access to institute management.     |
| **Institute Admin** | `09120000002` | `tehran`     | Manager for "آموزشگاه زبان تهران (مرکزی)".                  |
| **Clerk**           | `09120000003` | `tehran`     | Front-desk staff for classes, enrollment, and transactions. |
| **Student**         | `09120000004` | `tehran`     | Enrolled student (Ali Rezaei).                              |

---

## 🛠 Useful Scripts

- `pnpm dev`: Start all apps in watch mode.
- `pnpm build`: Build all apps and packages.
- `pnpm lint`: Run ESLint across all projects.
- `pnpm format`: Format all files with Prettier.
- `pnpm typecheck`: Run TypeScript type checking.
- `pnpm db:generate`: Regenerate Prisma Client.
- `pnpm db:migrate:dev`: Run Prisma development migrations.
- `pnpm db:seed`: Seed sample data.
- `pnpm db:studio`: Open Prisma Studio database GUI.
