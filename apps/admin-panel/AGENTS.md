# Admin Panel Frontend Rules (`apps/admin-panel`)

- **Role:** Desktop & responsive web dashboard for Institute Admins, Clerks, and Super Admins.
- **Implementation Skill:** For the complete unified recipe for Admin list pages, filters, URL sync, empty states, and breadcrumbs, refer to **`.agents/skills/kalameh-admin-page/SKILL.md`**.

## Multi-Language Architecture (`next-intl`)

- Path-based localization (`/[locale]/...`) supporting **Persian (`/fa/...`)** and **English (`/en/...`)** (Default: `fa`).
- Localized typography:
  - Persian (`fa`): `dir="rtl"`, Font: **Yekan Bakh** (`--font-sans` and `--font-mono`). **NEVER use `fontMono` / `Geist Mono` in Persian (`fa`) mode.** Any code using `font-mono` must resolve to Yekan Bakh in RTL mode.
  - English (`en`): `dir="ltr"`, Font: **Geist** (`--font-sans`), **Geist Mono** (`--font-mono`).
- **Every layout that renders `<NextIntlClientProvider>` must include `common` messages** in its `messages` object alongside feature-specific message namespaces.
- Never hardcode static text in `placeholder="..."` attributes. Always load via `useTranslations` (`t(...)`).

## Architecture & Layout Constraints

- All protected pages must use `AdminBaseLayout` (`components/admin-base-layout/index.tsx`).
- **Directory-Based Components & Single Component Per File:**
  - Every component must live in its own directory with an `index.tsx` entrypoint (e.g. `components/admin-base-layout/index.tsx`).
  - **Never create multiple components in a single file.** Every sub-component must be extracted into its own dedicated directory with an `index.tsx`.
- **File Length:** Keep files under 250 lines. Decompose large tables, dialogs, and forms into dedicated subcomponents.
- **Route Architecture & RBAC:**
  ```text
  app/[locale]/
  ├── (auth)/                     # Shared Login / Password Reset
  ├── (super-admin)/              # 🛡️ Protected for Role: SUPER_ADMIN
  └── (institute)/                # 🏫 Protected for Role: INSTITUTE_ADMIN & CLERK
  ```
- **Authentication & Route Guarding:** Handled via `proxy.ts`. Unauthenticated requests redirect to `/login`.

## API & Data Fetching (micro-rq + React Query)

- Separate API concerns under `lib/api/` (`client.ts`, `resources/*.resource.ts`, `index.ts`).
- Always use `.toQuery()` and `.toMutation()` with `@tanstack/react-query` (`useQuery`, `useMutation`).
- **NEVER** use the `.fn()` option of micro-rq directly in components.
- Errors are handled centrally by `onError` in `client.ts` via shadcn `toast.error`. Never create redundant inline error alert banners inside forms.

## UI Primitives & Elements

- **No Raw HTML Controls & No Raw <img>:** Never use `<button>`, `<input>`, `<select>`, `<table>`, or `<img>`. Use primitives from `@workspace/ui/components/*` and Next.js `<Image />`.
- **Loading:** Always use `<Spinner />` from `@workspace/ui/components/spinner`. Never use raw icons like `Loader2`.
- **Form Controls & Button Height (Unified 56px / h-14 & rounded-2xl):**
  - All form controls, inputs, selects, date pickers, price inputs, and action buttons must strictly default to **`h-14` (56px)**, **`rounded-2xl`**, and **`text-base`**.
  - Smaller sizes (`size="sm"` / `h-8`, `size="icon"`) are strictly reserved for table cell inline actions, calendar day cells, input adornments, and compact toolbar icons.
- **Dialogs & Confirmations:**
  - For "Are you sure?" confirmations, **ALWAYS** use `<AlertDialog />` from `@workspace/ui/components/alert-dialog`. Never use `ResponsiveDialog` or vanilla `alert()`.
  - For form sheets, inspectors, and wizards, use `<ResponsiveDialog>` / `<FormDialog>`.
  - **No In-Header Description:** Dialog headers are reserved for title, badges, and close button. Never render descriptions in dialog headers.
  - **Mandatory Dividers:** Header divider (`border-b border-border/60`) and footer divider (`border-t border-border/60`). Form fields must be wrapped in a scrollable container with padding (`px-4 py-4 sm:px-6 sm:py-5`).
- **Icons:** Must always match and inherit the exact semantic text color of their sibling label (`text-muted-foreground`, `text-foreground`, `text-destructive`).
- **Single Card Anti-Pattern:** Do not wrap pages in a `<Card>` if the content is already in a single container.
- **Card Actions:** Use `<ContextMenu />` and/or action dropdown menus. Do not duplicate the primary card button in the context menu.

## Admin List & Inner Page Standards (Quick Summary)

- **Title Routing:** Never render an in-page title. Register route in `getPageTitle` (`AdminHeader`).
- **URL Filters:** Always synchronize state with `useUrlFilters` (300ms search debounce, filter change resets page to 1, clean URLs).
- **Two-Tier Views:** Desktop uses `<DataTable />` with Add button in `<AdminFilterBar actions={...} className="hidden lg:inline-flex">`. Mobile (< `lg`) uses `<MobileList />` with `<FABSingle>` in `<AdminPageShell fab={...}>`.
- **Empty State:** Remove Add button from filter bar and place inside `<EmptyContent>`. Never wrap in `<Card>`. Center vertically on mobile. Hide mobile FAB on empty state.
- **Breadcrumbs:** Render `<AdminBreadcrumb />` in `AdminPageShell`'s `breadcrumb` prop on top of filters. Back navigation rendered next to title in `AdminHeader`.
- **Full Recipe:** See `.agents/skills/kalameh-admin-page/SKILL.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
