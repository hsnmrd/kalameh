# Admin Panel Frontend Rules (`apps/admin-panel`)

- **Role:** Desktop web dashboard for Institute Admins, Clerks, and Super Admins.
- **Multi-Language Architecture (`next-intl`):**
  - Path-based localization (`/[locale]/...`) supporting **Persian (`/fa/...`)** and **English (`/en/...`)** (Default: `fa`).
  - Localized direction & typography:
    - Persian (`fa`): `dir="rtl"`, Font: **Vazirmatn** (`--font-sans`).
    - English (`en`): `dir="ltr"`, Font: **Geist** (`--font-sans`).
  - Modular per-page message files in `messages/[locale]/` to optimize client bundle size.
  - **Every layout that renders `<NextIntlClientProvider>` must include `common` messages** in its `messages` object alongside feature-specific message namespaces.
- **Layout Architecture & Navigation:**
  - All admin-panel protected pages must use `AdminBaseLayout` (`components/admin-base-layout/index.tsx`).
  - The layout includes a static desktop sidebar (positioned dynamically on the right in RTL and left in LTR) with a language switcher, branding, and quick logout.
- **Directory-Based Components & Single Component Per File:**
  - Every component must live in its own directory with an `index.tsx` entrypoint (e.g. `components/admin-base-layout/index.tsx`, `components/providers/index.tsx`).
  - **Never create multiple components in a single file.** Every sub-component (e.g. `sidebar-brand`, `nav-list`, `sidebar-footer`, `mobile-drawer`, `admin-header`) must be stored in its own dedicated directory with an `index.tsx`.
- **Route Architecture & RBAC:**
  ```text
  app/[locale]/
  ├── (auth)/                     # Shared Login / Password Reset
  │   └── login/
  ├── (super-admin)/              # 🛡️ Protected for Role: SUPER_ADMIN
  │   ├── layout.tsx              # Uses AdminBaseLayout(role={ROLES.SUPER_ADMIN})
  │   └── institutes/             # Institute CRUD & license management
  └── (institute)/                # 🏫 Protected for Role: INSTITUTE_ADMIN & CLERK
      ├── layout.tsx              # Uses AdminBaseLayout(role={ROLES.INSTITUTE_ADMIN})
      ├── courses/
      ├── classes/
      ├── terms/
      └── transactions/
  ```
- **Authentication & Route Guarding:**
  - All pages require authentication. Unauthenticated requests to protected routes are automatically redirected to `/login` via `proxy.ts`.
- **Micro-RQ Architecture & Modular Structure:**
  - Separate API concerns into dedicated files under `lib/api/`:
    - `lib/api/client.ts`: `createMicroApi` configured with `credentials: "include"` and `onError` toast handler.
    - `lib/api/resources/*.resource.ts`: Dedicated resource definition files (e.g. `auth.resource.ts`, `users.resource.ts`).
    - `lib/api/index.ts`: Unified barrel exports.
- **Data Fetching Standard (Micro-RQ + React Query):**
  - Always use `.toQuery()` and `.toMutation()` with `@tanstack/react-query` (`useQuery`, `useMutation`).
  - **NEVER** use the `.fn()` option of micro-rq in components or event handlers.
- **Error Handling & Feedback:**
  - API errors are caught by `onError` in `client.ts` and shown via shadcn `toast.error` (which uses the Vazirmatn font).
  - Do not create redundant inline error alert banners inside forms.
- **Loading UI Standard:**
  - Use `<Spinner />` from `@workspace/ui/components/spinner` instead of raw `lucide-react` icons.
- **Image Standard (Next.js Image Only):**
  - **NEVER use raw `<img>` tags.** Always import and use Next.js `<Image />` from `next/image` (with `unoptimized` for uploaded/external assets wrapped in `getAssetUrl`).
- **Single Card Anti-Pattern:**
  - Do not wrap pages with a `<Card>` component if the page content is already rendered within a single container.
- **Card Action Architecture (Context Menu & Action Menu Standard):**
  - When a card (such as InstituteCard, StudentCard, ClassCard) has multiple actions (e.g. edit, delete, ban/block), utilize the shadcn / Base UI `<ContextMenu />` and/or action menus to maintain clean and decluttered card layouts.
  - **Do NOT duplicate actions in the context menu / dropdown menu that already exist as primary interactive buttons on the card itself** (such as the main open/manage card button).
- **Icon Color Consistency Standard:**
  - Icons must always match and inherit the exact semantic text color of their accompanying sibling label/text (`text-muted-foreground`, `text-foreground`, `text-destructive`). Never apply mismatched colored accent classes to icons next to neutral text.
- **Data Tables & Lists Standard:**
  - Always use the centralized `<DataTable />` component from `@workspace/ui/components/data-table` for displaying lists and data grids.
  - Define columns via TanStack `ColumnDef` and never use raw HTML `<table>` elements in views or components.
- **Forms & Validation:** Always use `react-hook-form` paired with `@hookform/resolvers/zod` and shared Zod schemas from `@workspace/types`.
- **File Length:** Keep files under 250 lines. Decompose large tables, dialogs, and forms into dedicated subcomponents.
