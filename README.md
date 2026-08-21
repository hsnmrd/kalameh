# کلمه | Kalameh Monorepo

Multi-tenant Language Learning & Institute Management SaaS Platform.

## 🏗 Architecture & Stack

- **Turborepo** + **pnpm workspaces**
- **Apps:**
  - `apps/api`: NestJS REST API with Prisma, Redis lock manager, and JWT/HttpOnly cookie auth.
  - `apps/admin-panel`: Next.js App Router dashboard (Persian / RTL / Vazirmatn font).
  - `apps/student-pwa`: Next.js Mobile-first PWA (English / LTR / Geist font, max-w-480px).
- **Packages:**
  - `packages/database`: Prisma schema, migrations, and seed scripts.
  - `packages/types`: Shared Zod schemas, inferred types, and `as const` roles/permissions.
  - `packages/ui`: Shared design system (Tailwind CSS v4 + Base UI / shadcn/ui).

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

| Application     | URL                     | Role / Description                                                        |
| --------------- | ----------------------- | ------------------------------------------------------------------------- |
| **Admin Panel** | `http://localhost:3000` | Persian desktop dashboard for Super Admins, Institute Admins, and Clerks. |
| **Backend API** | `http://localhost:3001` | NestJS RESTful API & Swagger / Health endpoints.                          |
| **Student PWA** | `http://localhost:3002` | English mobile-first portal for students.                                 |

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
