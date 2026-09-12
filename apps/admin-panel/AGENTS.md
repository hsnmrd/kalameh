# Admin Panel Frontend Rules (`apps/admin-panel`)

- **Role:** Desktop web dashboard for Institute Admins, Clerks, and Super Admins.
- **Multi-Language Architecture (`next-intl`):**
  - Path-based localization (`/[locale]/...`) supporting **Persian (`/fa/...`)** and **English (`/en/...`)** (Default: `fa`).
  - Localized direction & typography:
    - Persian (`fa`): `dir="rtl"`, Font: **Yekan Bakh** (`--font-sans` and `--font-mono`). **NEVER use `fontMono` / `Geist Mono` in Persian (`fa`) mode.** Any code using `font-mono` must resolve to Yekan Bakh in RTL mode.
    - English (`en`): `dir="ltr"`, Font: **Geist** (`--font-sans`), **Geist Mono** (`--font-mono`).
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
  - Always use the centralized `<DataTable />` component from `@workspace/ui/components/data-table` for displaying lists and data grids **on desktop (lg+)**.
  - Define columns via TanStack `ColumnDef` and never use raw HTML `<table>` elements in views or components.
  - **On mobile (< lg): use `<MobileList />` from `@workspace/ui/components/mobile-list` instead of `DataTable`.** See Mobile UX Standard below.
- **Forms & Validation:** Always use `react-hook-form` paired with `@hookform/resolvers/zod` and shared Zod schemas from `@workspace/types`.
- **No Vanilla JS Dialogs (`alert`, `prompt`):** NEVER use native browser `alert()` or `prompt()`. Use shadcn/Sonner `toast` for notifications.
- **Confirmation Modals (`AlertDialog`):** For all actions asking the user to confirm (e.g. `delete-*-modal`, reset permissions, "are you sure?"), ALWAYS use `<AlertDialog />` from `@workspace/ui/components/alert-dialog`. Do NOT use `ResponsiveDialog` or `Dialog` for confirmation prompts.
- **Input & Form Modals (`ResponsiveDialog` / `FormDialog`):** Use `ResponsiveDialog` or `FormDialog` from `@workspace/ui/components/dialog` for user inputs, form sheets, details inspectors, and wizards.
- **File Length:** Keep files under 250 lines. Decompose large tables, dialogs, and forms into dedicated subcomponents.
- **Concise Button Labels Standard (Short Titles over Verbose Phrases):**
  - Buttons, submit actions, step transitions, and dialog triggers must **ALWAYS** use concise, succinct action titles (e.g. `ادامه` / `Continue`, `تأیید` / `Confirm`, `ذخیره` / `Save`, `انصراف` / `Cancel`, `بازگشت` / `Back`).
  - **NEVER** use long, descriptive, or verbose phrases in button titles (e.g. avoid `ادامه و مشاهده پیش‌نمایش`, `ذخیره تغییرات و بازگشت به صفحه قبل`, `تأیید اطلاعات و رفتن به مرحله بعد`).
  - Place descriptive context, explanations, or guidance in headers, descriptions, callouts, or form helper text — never inside the button text.
- **Form Input Height & Touch Target Standard (Unified 56px / h-14 & rounded-2xl):**
  - All form controls, text inputs (`Input`), date pickers (`DatePicker`), date inputs (`DateInput`), selects (`Select`), comboboxes (`Combobox`, `ResponsiveCombobox`), password inputs (`PasswordInput`), and price inputs (`PriceInput`) must strictly use the standard height of **`h-14` (56px)**, **`rounded-2xl`**, **`px-4`**, and **`text-base`** typography.
  - **NEVER use arbitrary smaller heights (such as `h-9`, `h-10`, `h-11`, `h-12`) for inputs, date pickers, or selects in forms, dialogs, modals, drawers, or sheets.**
  - **Rationale:** 56px (`h-14`) ensures an ergonomic, easily clickable touch target (> 48px WCAG recommendation) on mobile devices and accessible clickability on desktop, while guaranteeing perfect visual alignment across sibling form fields (such as title input next to or above date pickers and dropdowns).
  - Compact heights (`h-9` / `h-10`) are strictly restricted to inline table-cell editing inside dense data tables.

## Admin List Page Layout & Filter Standard (Unified UX)

All entity management and list pages (e.g. `courses/`, `classes/`, `terms/`, `branches/`, `operating-phases/`) must strictly adhere to this layout standard:

### 1. Root Header Title Routing (No In-Page Title or Description)

- **NEVER** render an in-page title (`<h1>`), subtitle, icon, or description inside list page containers.
- The page title must **ALWAYS** be rendered dynamically in the root header (`AdminHeader`) by registering the route in `getPageTitle(pathname, t)` (`components/admin-base-layout/admin-header/index.tsx`) and mapped to `t("nav.<routeKey>")` in `messages/[locale]/common.json`.

### 2. Mandatory Filter Bar & Search Input

- Every list page must pass a dedicated, collocated filter component (`*Filter/index.tsx`) into the `filters` prop of `<AdminPageShell>`.
- The filter component must use `<AdminFilterBar>` and include at least an `<AdminSearchInput>` for search filtering.
- Additional dropdown filters (status, category, etc.) must use `<ResponsiveCombobox>` inside the `filters` prop of `<AdminFilterBar>`.

### 3. Desktop Add Button Location (Inside Filter Bar Actions)

- The primary "Add / Create" button on desktop (`sm:` and above) must **ALWAYS** be rendered inside the `actions` prop of `<AdminFilterBar>`, wrapped in `<PermissionGuard mode="hide">`.
- Use the standard button style:
  ```tsx
  <Button
    type="button"
    onClick={onAddClick}
    className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
  >
    <Plus className="size-5" />
    <span>{t("addItem")}</span>
  </Button>
  ```
- **NEVER** place this creation button in an in-page header or in the root header `actions` slot for list pages.

### 4. Mobile Floating Action Button (FAB)

- `<AdminFilterBar>` automatically hides the desktop `actions` slot on screens `< sm`.
- On mobile, creation is exclusively triggered via `<FABSingle>` (or `<FABMenuTrigger>`) passed to the `fab` prop of `<AdminPageShell>`, wrapped in `<PermissionGuard mode="hide">`.

### 5. FormDialog Internal Padding Standard

- When using `<FormDialog>` / `<FormDialogContent>`, the form content between `<FormDialogHeader>` and `<FormDialogFooter>` must be wrapped in a scrollable, padded container:
  ```tsx
  <form
    onSubmit={handleSubmit(onSubmit)}
    className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
  >
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
      {/* Form Fields */}
    </div>
    <FormDialogFooter>{/* Actions */}</FormDialogFooter>
  </form>
  ```
- **NEVER** omit horizontal padding (`px-4 sm:px-6`) or let input controls touch the modal borders.

## Mobile UX Standard

All admin-panel list pages and overlays must follow these mobile-specific rules for screens **< `lg` (1024px)**:

### 1. Mobile List View (no DataTable on mobile)

- Each list page must have **two sibling components**: `*-table/` (desktop) and `*-list/` (mobile).
- Page layout: `<div className="hidden lg:block"><XTable /></div>` + `<div className="lg:hidden"><XList /></div>`.
- Mobile list uses `MobileList`, `MobileListItem`, `MobileListItemIcon`, `MobileListItemContent`, `MobileListItemTrailing` from `@workspace/ui/components/mobile-list`.
- Items are separated by thin dividers, minimal height (~60px), no inline action buttons.
- **Click** on item → navigate to detail or open edit modal.
- **Long-press / right-click** → use `ContextMenu` from `@workspace/ui/components/context-menu` to show Edit, Delete, etc.

### 2. FAB (Floating Action Button) replaces header Create button on mobile

- `AdminPageHeader` action button is hidden on mobile (`hidden lg:flex`).
- Every list page must render a `FABSingle` or `FABMenuTrigger` from `@workspace/ui/components/fab` in the `fab` prop of `AdminPageShell`.
- Single-action pages → `FABSingle` with `+` icon.
- Multi-action pages (e.g. Users with Create + Import + Export) → `FABMenuTrigger` that opens a `Drawer` (bottom sheet) with action buttons.
- Wrap FAB in `<PermissionGuard mode="hide">` when the action requires a permission.

### 3. Popover → Bottom-sheet Drawer on mobile

- Use `ResponsivePopover` from `@workspace/ui/components/popover` instead of raw `Popover`.
- On mobile it renders a `Drawer` bottom sheet; on desktop it renders the standard popover.

### 4. Combobox → Bottom-sheet Drawer on mobile

- Use `ResponsiveCombobox` from `@workspace/ui/components/combobox` instead of `Combobox` in any filter or form.
- On mobile it renders a `Drawer` with search + option list; on desktop it renders the standard Base UI combobox dropdown.
- Always pass a `drawerTitle` prop to name the option list in the Drawer.

### 5. Modal → Bottom-sheet Drawer on mobile

- For non-confirmation modals (forms, inspectors, wizards), use `ResponsiveDialog`, `ResponsiveDialogContent`, `ResponsiveDialogHeader`, `ResponsiveDialogFooter`, `ResponsiveDialogTitle`, `ResponsiveDialogDescription`, `ResponsiveDialogCloseButton` from `@workspace/ui/components/dialog` instead of `Dialog`/`DialogPopup`.
- On mobile it slides up as a Drawer; on desktop it renders the standard centered dialog.
- Form content must include `px-6 pb-6` padding when inside a `ResponsiveDialogContent`.
- **For confirmations ("Are you sure?", delete actions), use `AlertDialog` from `@workspace/ui/components/alert-dialog` instead of `ResponsiveDialog`.**

### 6. Filters → Bottom-sheet Drawer on mobile

- `AdminFilterBar` automatically handles this: filters are hidden on mobile and accessible via a `SlidersHorizontal` icon button next to the search input.
- The filter drawer title can be customized via `filterDrawerTitle` prop.
- Always pass `filterButtonAriaLabel` translated with `useTranslations`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
