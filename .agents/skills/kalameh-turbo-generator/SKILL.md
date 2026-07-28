---
name: kalameh-turbo-generator
description: Use this skill when working in the Kalameh monorepo and the user wants to scaffold, extend, or follow the existing Turbo generator structure for apps/web features, pages, components, modals, hooks, helpers, mock data, feature route groups, directory-only segments, or generator rollback behavior.
---

# Kalameh Turbo Generator

## Overview

Use the local Turbo generator as the source of truth for app structure. Preserve its intent: scaffold small Next.js App Router feature groups inside `apps/{app}` without changing route URLs, keep shared artifacts close to their feature/page, and track generator output so the last run can be reversed.

## Before Editing

- Read `AGENTS.md`, then read the relevant Next.js guide in `node_modules/next/dist/docs/` before changing Next.js app files.
- Inspect `turbo/generators/config.ts`, `turbo/generators/lib/*`, and `turbo/generators/templates/*` before changing generator behavior.
- Keep `turbo/generators/config.ts` as the entrypoint. Put reusable mechanics in `turbo/generators/lib`.
- Do not bypass `withTracking` for file-producing actions. The `reverse` generator depends on `.turbo/gen/last-run.json`.

## App Structure

- Target apps come from `apps/*`.
- The generator uses `apps/{app}/src/app` when it exists; otherwise it uses `apps/{app}/app`. This repo currently supports the legacy app root.
- Features are route groups: `({feature})`, so the feature name does not appear in the URL.
- Feature-shared code goes in `({feature})/(common)`.
- Pages use nested route segments. When a segment has child segments, its own page/layout/loading artifacts live under `(root)` to avoid colliding with children.
- Page-scoped code goes beside the page container in `components`, `hooks`, `helper`, `mock-data`, or `modal`.

## Generator Map

- `feature`: creates translation JSON files when `packages/translation/src/type.ts` exposes `locales`.
- `page`: adds `page.tsx`, `layout.tsx`, `loading.tsx`, and `page.test.tsx`; normalizes parent page artifacts into `(root)` when needed.
- `directory`: adds a directory-only segment with `(root)/layout.tsx` and `(root)/loading.tsx`.
- `component`: supports `ui`, `app`, `feature`, and `page` scopes.
- `artifact`: adds `hooks`, `helper`, or `mock-data` files in feature or page scope.
- `modal`: adds page/common modal files, updates the modal registry, and wraps root layout children with `ModalWrapper`.
- `reverse`: reverts the last tracked generator run.

## Working Pattern

1. Prefer running the generator for new app structure instead of hand-creating folders.
2. If modifying generator behavior, keep prompts and generated paths backward-compatible unless the user explicitly asks for a structural change.
3. Add templates under `turbo/generators/templates` and keep template paths routed through `templatePath`.
4. Keep route groups, `(common)`, `(root)`, and page support directory names stable.
5. Validate changes with representative generator runs or TypeScript checks, then reverse or clean up generated test output.

## Common Commands

```bash
pnpm turbo gen
pnpm turbo gen page
pnpm turbo gen component
pnpm turbo gen reverse
```

For non-interactive validation, set `CI=1` and pass prompt answers through Turbo's supported arguments for the current version.
