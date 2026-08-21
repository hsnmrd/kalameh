---
name: kalameh-turbo-generator
description: Use this skill when working in the Kalameh monorepo and the user wants to scaffold, extend, or follow the existing Turbo generator structure for apps/web features, pages, components, modals, hooks, helpers, mock data, feature route groups, directory-only segments, or generator rollback behavior.
---

# Kalameh Turbo Generator

## Overview

Use the local Turbo generator as the source of truth for app structure. Preserve its intent: scaffold clean Next.js App Router route groups inside `apps/{app}` without changing route URLs, keep page-scoped artifacts colocated in sibling directories, house shared cross-page components in the app root `components/`, and track generator output so runs can be reversed.

## Architecture & File Collocation Rules

### 1. Page-Scoped Collocation & Sibling Directory Structure

- **Named Routes (e.g. `/classes`, `/institutes`, `/login`, `/profile`, `/enrollments`):**
  - Use the route segment directory directly (e.g. `app/[locale]/(admin)/classes/`, `app/[locale]/(auth)/login/`).
  - Do NOT nest redundant route groups inside named directories.
  - Sibling directories live directly alongside `page.tsx` within that route segment directory:
    ```text
    app/[locale]/(admin)/classes/
    ├── page.tsx
    ├── layout.tsx (optional)
    ├── loading.tsx (optional)
    ├── components/          # Page-specific components only
    │   └── class-card/
    │       └── index.tsx
    ├── hooks/               # Page-specific hooks
    │   └── use-class-filters.ts
    ├── helper/              # Page-specific helpers and utilities
    │   └── formatters.ts
    ├── mock-data/           # Page-specific mock data
    │   └── index.ts
    └── modal/               # Page-specific dialogs and modals
        └── add-class-modal/
            └── index.tsx
    ```

- **Index Routes (e.g. `/` root dashboard inside route groups):**
  - Encapsulate `page.tsx` and its sibling directories inside an App Router grouping folder `({page})` (e.g. `app/[locale]/(admin)/(dashboard)/`):
    ```text
    app/[locale]/(admin)/(dashboard)/
    ├── page.tsx
    ├── components/
    │   ├── stat-card/
    │   │   └── index.tsx
    │   ├── super-admin-view/
    │   │   └── index.tsx
    │   └── institute-admin-view/
    │       └── index.tsx
    └── hooks/
    ```

### 2. App-Level Shared Components

- When a component, layout, provider, or widget is shared across multiple pages within an application, place it in the app's root `components/` directory:
  ```text
  apps/{app}/components/
  ├── admin-base-layout/
  │   └── index.tsx
  ├── student-toolbar/
  │   └── index.tsx
  └── providers/
      └── index.tsx
  ```

### 3. Monorepo-Level Shared UI Primitives

- Universal, accessible design tokens and UI primitives (Base UI / Tailwind v4) belong in `packages/ui/src/components/*` (`Button`, `Input`, `Field`, `Spinner`, `PasswordInput`, etc.).

### 4. Directory-Based Component Architecture & Single Component Per File

- All components must be created inside a dedicated directory named after the component with an `index.tsx` entrypoint (e.g. `components/class-card/index.tsx`).
- **Never create multiple components in a single file.** Every sub-component, header, list item, or action button wrapper must be extracted into its own dedicated directory with an `index.tsx`.

---

## Generator Map

- `feature`: creates translation JSON files when `packages/translation/src/type.ts` exposes `locales`.
- `page`: adds `page.tsx`, `layout.tsx`, `loading.tsx`, and `page.test.tsx` inside an App Router grouping folder; normalizes parent page artifacts when needed.
- `directory`: adds a directory-only segment with `(root)/layout.tsx` and `(root)/loading.tsx`.
- `component`: supports `ui` (monorepo), `app` (app root shared), `feature` (feature common), and `page` (page sibling `components/` directory) scopes.
- `artifact`: adds `hooks`, `helper`, or `mock-data` files as sibling directories to `page.tsx` or in feature scope.
- `modal`: adds page/common modal files, updates the modal registry, and wraps root layout children with `ModalWrapper`.
- `reverse`: reverts the last tracked generator run.

---

## Working Pattern

1. Prefer running the generator for new app structure instead of hand-creating folders.
2. If modifying generator behavior, keep prompts and generated paths backward-compatible unless the user explicitly asks for a structural change.
3. Add templates under `turbo/generators/templates` and keep template paths routed through `templatePath`.
4. Keep route groups `(...)`, `(common)`, and page support sibling directory names (`components`, `hooks`, `helper`, `mock-data`, `modal`) stable.
5. Validate changes with representative generator runs or TypeScript checks, then reverse or clean up generated test output.

## Common Commands

```bash
pnpm turbo gen
pnpm turbo gen page
pnpm turbo gen component
pnpm turbo gen reverse
```

For non-interactive validation, set `CI=1` and pass prompt answers through Turbo's supported arguments for the current version.
