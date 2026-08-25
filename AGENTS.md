# Repository Engineering Rules (Global Hub)

- **SOLID & Modular Design:** Follow SOLID principles across all apps and packages.
- **Testing:** Write test files for new behavior (unit tests for focused logic, integration/e2e for critical flows).
- **Git Hooks & Quality Gate:** Prettier and ESLint are enforced by Husky (`.husky/pre-commit`) and `lint-staged` on every commit. Never bypass hooks.
- **Environment Configuration:** All environment variables must be managed centrally in the root `.env` and declared in `turbo.json` under `globalEnv`. Do not create disconnected per-app `.env` files.
- **API Request Architecture (micro-rq + React Query):**
  - Always use `micro-rq` endpoint definitions via `.toQuery()` and `.toMutation()` passed directly into TanStack React Query (`useQuery`, `useMutation`).
  - **NEVER** use the `.fn()` option of `micro-rq` directly inside React components for data fetching or form submissions, as this bypasses React Query's reactive state tracking (loading, error, caching).
- **Authentication & HttpOnly Cookies:**
  - Frontends must configure `credentials: "include"` in the `fetcher` of `createMicroApi`.
  - `apps/api` must issue `httpOnly` secure cookies (`access_token`) on authentication alongside returning user payloads.
- **Error Handling & Notifications:**
  - Global API errors in `createMicroApi` (`onError`) must trigger the centralized shadcn `toast.error` notification.
  - Do not render duplicate inline error banner cards inside pages/forms when toast notifications handle error presentation.
  - Toast styling must inherit the application's configured typography font variable (`var(--font-sans)`).
- **Loading UI Standard:**
  - Always use the centralized shadcn `<Spinner />` component from `@workspace/ui/components/spinner` for loading states.
  - Do not use raw icons like `Loader2` from `lucide-react` for loading indicators.
- **Single Card Anti-Pattern:**
  - Do NOT wrap an entire page inside a `<Card>` component if the whole content of the page is already housed in a single container (such as centered auth forms or fullscreen dashboard layouts).
- **Card Action Architecture (Context Menu & Dropdown Standard):**
  - When a card, tile, or grid item has multiple actions (e.g. edit, delete/soft-delete, open/manage, ban/block, duplicate), use the shadcn / Base UI `<ContextMenu />` (and/or an accessible action dropdown menu) to keep card interfaces clean, uncluttered, and ergonomic.
- **Page Collocation & Sibling Directory Architecture:**
  - For named routes (e.g. `/classes`, `/institutes`, `/login`, `/profile`), use the route's own directory (`classes/`, `institutes/`, `login/`, etc.). Do not nest redundant route groups inside named directories.
  - For index routes (e.g. `/` root dashboard), encapsulate `page.tsx` and its sibling directories within a route group `({page})` (e.g. `(dashboard)`) so the URL remains `/`.
  - Page-specific artifacts must live as sibling directories directly alongside `page.tsx` (`components/`, `hooks/`, `helper/`, `mock-data/`, `modal/`).
  - Components shared across multiple pages or layouts belong in the app root `components/` (`apps/{app}/components/`).
  - Monorepo-wide UI primitives belong in `packages/ui`.
- **Directory-Based Component Architecture & Single Component Per File:**
  - All components must be created inside their own dedicated directory with an `index.tsx` file (e.g. `components/admin-base-layout/index.tsx`, `components/providers/index.tsx`).
  - **Never create multiple components in a single file.** Every sub-component, header, brand, or list component must be extracted into its own dedicated sibling or nested directory with its own `index.tsx` (e.g. `components/admin-base-layout/sidebar-brand/index.tsx`, `components/admin-base-layout/nav-list/index.tsx`).
- **UI Primitives & Elements Standard (No Raw HTML Controls & No Raw <img>):**
  - **NEVER** use simple raw HTML elements (such as `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`) directly in application pages or components (`apps/*`).
  - **NEVER** use raw `<img>` HTML tags. Always import and use Next.js `<Image />` component from `next/image` (with `unoptimized` where dynamic external / uploaded asset URLs are used) across all apps and packages.
  - Always import and use centralized, accessible UI primitives from `@workspace/ui/components/*` (`Button`, `Input`, `Field`, `PasswordInput`, `DataTable`, `Table`, etc.).
  - If a specific UI component or kit (e.g. Select, Dialog, Dropdown, Checkbox) is needed and does not yet exist in `@workspace/ui`, create an implementation plan to scaffold/install it into `packages/ui` first using Base UI / shadcn patterns before using it.
- **Data Table & Data Grid Standard:**
  - Always use the centralized `<DataTable />` component from `@workspace/ui/components/data-table` for displaying tabular data.
  - Define columns using TanStack Table `ColumnDef` to ensure consistent typography, responsive design, empty states, and accessibility across all dashboards.
  - Never render raw `<table>` or custom HTML table markups in application pages.
- **Price & Currency Standard:**
  - Always use `<Price amount={value} />` from `@workspace/ui/components/price` (or `formatCurrency` from `@workspace/ui/lib/utils`) to format prices.
  - **Always format price numbers with `toLocaleString("en-US")` (English digits e.g. `1,500,000 تومان`) even when the active locale is `fa`.**
  - Do NOT implement ad-hoc `formatCurrency` functions in components or pages. The centralized helper handles 3-digit comma separation and localized currency units (`تومان` / `Toman`).
- **General Number Formatting Standard:**
  - Use `formatNumber` from `@workspace/ui/lib/utils` for counts, indexes, and statistical numbers, which formats digits dynamically based on the active locale (`fa-IR` vs `en-US`).
- **Theme & Dark Mode Standard (Semantic CSS Variables Only):**
  - All apps must wrap their provider tree with `<ThemeProvider />` from `@workspace/ui/components/theme-provider` and provide `<ThemeToggle />` from `@workspace/ui/components/theme-toggle` in headers/navigation.
  - **NEVER use `dark:` Tailwind class variants.** All theme adaptations must be driven 100% through semantic CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-muted`, etc.) configured in `globals.css`.
- **Shared Roles & Permissions:**
  - Roles and permissions must be defined as `const` in `@workspace/types` (`ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`) and shared across all frontend apps and backend services.
- **NextIntl Client Messages & Placeholder Localization Standard:**
  - Every layout that mounts a `<NextIntlClientProvider>` MUST include `common` messages in its messages dictionary alongside any feature-specific message namespaces (e.g. `messages={{ common: common.default, feature: feature.default }}`).
  - **NEVER hardcode static text in `placeholder="..."` attributes.** All placeholders, labels, hints, and error messages MUST be defined in locale message files (`messages/{fa,en}/*.json`) and loaded via `useTranslations` (`t(...)`).
- **Automated Database Migrations:**
  - Whenever modifying `packages/database/schema.prisma` or altering database models, the agent MUST automatically create and execute the development migration via `pnpm run db:migrate:dev --name <descriptive_snake_case_name>` and regenerate Prisma Client types (`pnpm run db:generate`) without requiring manual prompting from the user.

## Context Routing

To reduce token burn and preserve context precision, read the relevant scoped rules before modifying code in any app or package:

- **Database & Migrations (`packages/database`):** Read `packages/database/AGENTS.md`
- **Backend API (`apps/api`):** Read `apps/api/AGENTS.md`
- **Admin Dashboard (`apps/admin-panel`):** Read `apps/admin-panel/AGENTS.md`
- **Student PWA (`apps/student-pwa`):** Read `apps/student-pwa/AGENTS.md`
- **Shared UI Library (`packages/ui`):** Read `packages/ui/AGENTS.md`
- **Shared Zod Types (`packages/types`):** Read `packages/types/AGENTS.md`
