# Repository Engineering Rules (Global Hub)

## 🚨 MANDATORY PRE-TASK GATE: Parallel Worktree Isolation

**CRITICAL PROTOCOL FOR ALL CODING TASKS:**
Before reading files to modify code, editing files, or running task commands:

1. **Prompt for Branch (Chat Initialization Only):**
   - **Not Yet Initialized in Chat:** If a target branch / worktree has NOT been specified or initialized yet in the current chat, the AI assistant MUST prompt the user for the target branch / worktree name:
     > _"Please specify the target branch / worktree name for this task so we can isolate our work in `.worktrees/<branch-name>`."_
   - **Already Initialized in Chat:** When a new prompt is received within the same chat where the branch/worktree has already been established, DO NOT prompt for the branch name again. Continue working in the existing `.worktrees/<branch-name>`.
2. **Pull Base & Worktree Setup:**
   - **Initial Setup (when branch name is provided):**
     - **Pull Latest Base:** Fetch and pull latest changes from the base branch (`git pull origin <base-branch>`) to guarantee the new worktree branches from the freshest upstream commit.
     - **Create Worktree:** `git worktree add -b <branch-name> .worktrees/<branch-name> <base-branch>` (or attach if branch exists: `git worktree add .worktrees/<branch-name> <branch-name>`).
     - **Copy Root .env:** Copy `.env` to `.worktrees/<branch-name>/.env` (`cp .env .worktrees/<branch-name>/.env` or PowerShell `Copy-Item -Path ".env" -Destination ".worktrees\<branch-name>\.env"`).
     - **Copy Generated Prisma Types:** Copy `packages/database/src/generated` to `.worktrees/<branch-name>/packages/database/src/generated` (`cp -R packages/database/src/generated .worktrees/<branch-name>/packages/database/src/generated` or PowerShell `Copy-Item -Recurse -Path "packages\database\src\generated" -Destination ".worktrees\<branch-name>\packages\database\src\generated"`).
   - **Mandatory Base Sync on Every New Prompt:** Because the base branch is updated frequently, at the start of every new prompt or task in an ongoing chat, the AI assistant MUST pull/merge the latest changes from the base branch into the active branch before starting any new work (`git fetch origin <base-branch> && git merge origin/<base-branch>` or `git pull origin <base-branch>`).
3. **Strict Isolation:** All subsequent file operations, tests, database migrations, and terminal commands must strictly target `.worktrees/<branch-name>`.
4. **Teardown on Completion:** Once the task branch is committed and merged, remove via `git worktree remove .worktrees/<branch-name> --force`.
5. **Exemption:** Pure advisory or question-answering chats with no file modifications do not require a worktree.

---

## Core Engineering Invariants

- **SOLID & Modular Design:** Follow SOLID principles across all apps and packages.
- **Backend Service Separation:** Keep backend services focused on one domain responsibility. Target a maximum of 300 lines for production service files; split oversized services into injectable query, command, validation, persistence, composition, import/export, or calculation collaborators. Register extracted collaborators through NestJS dependency injection and cover them with focused unit tests. Cohesive algorithm implementations may exceed the target only when splitting would obscure the algorithm; keep orchestration and I/O outside those files and document the exception beside the service.
- **Testing & Targeted Execution:**
  - Write test files for new behavior (unit tests for focused logic, integration/e2e for critical flows).
  - **NEVER run the full application test suite (1,000+ tests) during development or iterative debugging.** Run **ONLY** the specific test file being modified or authored:
    `pnpm --filter <app> test -- <filename>.spec.tsx`
  - **PowerShell Path Escaping:** In Windows PowerShell, Next.js App Router paths with `[locale]` or `(admin)` cause syntax errors (`admin: The term 'admin' is not recognized`). Pass **ONLY the test filename** to Vitest (e.g. `pnpm --filter admin-panel test -- scheduling-generation-form.spec.tsx`), or wrap full paths in single quotes: `'src/app/[locale]/(admin)/.../file.spec.tsx'`.
  - **Preventing Cascade Test Mock Failures:** When introducing cross-cutting business rules (e.g. institute financial readiness, license checks, activation gates), ensure shared mock factories/fixtures provide valid baseline values by default. Test blocked/negative states explicitly in dedicated tests using mock overrides, rather than breaking the baseline mock state across the entire suite.
  - Only execute the full suite as a final pre-commit quality check.
- **Commit on Task Completion:** Always commit all changes when a task is done. Ensure clear, conventional commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`) are used, and never declare a task finished while leaving uncommitted changes in the working tree.
- **Git Hooks & Quality Gate:** Prettier and ESLint are enforced by Husky (`.husky/pre-commit`) and `lint-staged` on every commit. Never bypass hooks.
- **Environment Configuration:** All environment variables must be managed centrally in the root `.env` and declared in `turbo.json` under `globalEnv`. Do not create disconnected per-app `.env` files.

---

## API, Authentication & State Standards

- **API Request Architecture (micro-rq + React Query):**
  - Always use `micro-rq` endpoint definitions via `.toQuery()` and `.toMutation()` passed directly into TanStack React Query (`useQuery`, `useMutation`).
  - **NEVER** use the `.fn()` option of `micro-rq` directly inside React components for data fetching or form submissions, as this bypasses React Query's reactive state tracking (loading, error, caching).
- **Authentication & HttpOnly Cookies:**
  - Frontends must configure `credentials: "include"` in the `fetcher` of `createMicroApi`.
  - `apps/api` must issue `httpOnly` secure cookies (`access_token`) on authentication alongside returning user payloads.
- **Shared Roles & Permissions:**
  - Roles and permissions must be defined as `const` in `@workspace/types` (`ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`) and shared across all frontend apps and backend services.
- **Zod Schema Import Standard (Prevent TS2345):**
  - Always import `z` directly from `@workspace/types` (`import { z } from "@workspace/types"`), **NEVER** from `"zod"` directly in frontend apps, forms, or DTOs.
  - This avoids duplicate monorepo package resolutions and eliminates type incompatibility errors (`TS2345`) when paired with `@hookform/resolvers/zod`.
- **Shared Package Build Requirement (`@workspace/types`):**
  - `@workspace/types` compiles to `./dist`. Whenever adding or modifying schemas, types, or helpers in `packages/types/src/`, always run `pnpm --filter @workspace/types build` so dependent apps (`apps/api`, `apps/admin-panel`) immediately resolve the updated types without TypeScript mismatch errors.
- **Error Handling & Notifications:**
  - Global API errors in `createMicroApi` (`onError`) must trigger the centralized shadcn `toast.error` notification.
  - Do not render duplicate inline error banner cards inside pages/forms when toast notifications handle error presentation.
  - Toast styling must inherit the application's configured typography font variable (`var(--font-sans)`).

---

## UI/UX & Component Standards

- **UI Primitives & Elements Standard (No Raw HTML Controls & No Raw <img>):**
  - **NEVER** use simple raw HTML elements (such as `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`) directly in application pages or components (`apps/*`).
  - **NEVER** use raw `<img>` HTML tags. Always import and use Next.js `<Image />` component from `next/image` (with `unoptimized` where dynamic external / uploaded asset URLs are used) across all apps and packages.
  - Always import and use centralized, accessible UI primitives from `@workspace/ui/components/*` (`Button`, `Input`, `Field`, `PasswordInput`, `DataTable`, `Table`, etc.).
- **Loading UI Standard:**
  - Always use the centralized shadcn `<Spinner />` component from `@workspace/ui/components/spinner` for loading states. Never use raw icons like `Loader2` from `lucide-react`.
- **Form Input & Button Height Standard (Unified 56px / h-14 & rounded-2xl):**
  - All form controls, text inputs (`Input`), date pickers (`DatePicker`), date inputs (`DateInput`), selects (`Select`), comboboxes (`Combobox`, `ResponsiveCombobox`), password inputs (`PasswordInput`), price inputs (`PriceInput`), and primary/form/dialog/action buttons (`<Button />`) must strictly follow the standard height of **`h-14` (56px)**, **`rounded-2xl`**, and **`text-base`** typography.
  - `<Button />` defaults directly to **`h-14` / `rounded-2xl` (`size: "default"`)**. Never handcraft repetitive `h-14 rounded-2xl ...` utility classes in callsites.
  - Smaller sizes (`size="sm"` / `h-8`, `size="icon"`, `size="icon-sm"`, `size="icon-xs"`) are strictly reserved for inline table cell actions, internal input adornments, date picker calendar days, and compact header/toolbar icons.
- **Confirmation & Alert Dialog Standard (`AlertDialog`):**
  - **For all confirmation scenarios where the user is asked "Are you sure?" (e.g. delete confirmations, destructive resets, irreversible actions), ALWAYS use `<AlertDialog />` from `@workspace/ui/components/alert-dialog` instead of `<Dialog />` or `<ResponsiveDialog />`.**
  - Compose confirmation flows with `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, and `AlertDialogCancel`.
  - Regular `<Dialog />` / `<ResponsiveDialog />` / `<FormDialog />` are strictly reserved for forms, inputs, data viewers, and wizards.
- **No Vanilla JS Dialogs (`alert`, `prompt`):**
  - **NEVER** use vanilla JavaScript `alert()` or `prompt()` anywhere in applications. Use centralized toast notifications (`sonner`) or modal dialogs.
- **Modal Header & Divider Standard (No In-Header Description & Mandatory Dividers):**
  - Standard modals and dialogs (`Dialog`, `ResponsiveDialog`, `FormDialog`) must **NEVER** render a description inside their header (`*Header`). Modal headers are strictly reserved for the concise title (`*Title`), status badges, and close button (`*CloseButton`).
  - **Always use a header divider:** `border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4`.
  - **Always use a footer divider:** `border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4`.
  - Modal content containers must use `overflow-hidden p-0` with inner content wrapped in a scrollable, padded container (`overflow-y-auto px-4 py-4 sm:px-6 sm:py-5`).
- **Typography & Font Standard (No fontMono in Persian / RTL):**
  - In Persian (`fa` / RTL mode), **NEVER use `fontMono` / `Geist Mono`**.
  - All typography in Persian (including monospace utility `font-mono`, numbers, codes, prices, dates, badges, tables) must use **Yekan Bakh** (`var(--font-sans)`).
  - In English (`en` / LTR mode), use **Geist** for `--font-sans` and **Geist Mono** for `--font-mono`.
- **Theme & Dark Mode Standard (Semantic CSS Variables Only):**
  - All apps must wrap their provider tree with `<ThemeProvider />` from `@workspace/ui/components/theme-provider` and provide `<ThemeToggle />` in headers/navigation.
  - **NEVER use `dark:` Tailwind class variants.** All theme adaptations must be driven 100% through semantic CSS variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-muted`, etc.) configured in `globals.css`.
- **Price & Currency Standard:**
  - Always use `<Price amount={value} />` from `@workspace/ui/components/price` (or `formatCurrency` from `@workspace/ui/lib/utils`) to format prices.
  - **Always format price numbers with `toLocaleString("en-US")` (English digits e.g. `1,500,000 تومان`) even when the active locale is `fa`.**
  - For price inputs, use `<PriceInput />` with 3-digit comma separation and embedded currency unit (`تومان`). Never put the currency unit in the field label.
- **Concise Button Labels Standard (Short Titles over Verbose Phrases):**
  - Buttons, submit actions, step transitions, and dialog triggers must **ALWAYS** use concise action titles (e.g. `ادامه`, `تأیید`, `ذخیره`, `انصراف`, `بازگشت`). Never use verbose phrases in button titles.
- **Directory-Based Component Architecture & Single Component Per File:**
  - All components must be created inside their own dedicated directory with an `index.tsx` file (e.g. `components/admin-base-layout/index.tsx`).
  - **Never create multiple components in a single file.** Every sub-component must be extracted into its own dedicated sibling or nested directory.

---

## Database, Migrations & Domain Anchors

- **Automated Database Migrations & Migration Immutability:**
  - Whenever modifying `packages/database/schema.prisma` or altering database models, the agent MUST automatically execute `pnpm run db:migrate:dev --name <descriptive_snake_case_name>` and regenerate Prisma Client types (`pnpm run db:generate`) without waiting for user prompts.
  - **NEVER edit or modify an existing `migration.sql` file once created, applied, or committed.** Always generate a new incremental migration for subsequent schema adjustments.
- **Term Activation Window Standard (7 Days Before / 7 Days After Start Date):**
  - A term activates exactly **7 days before its `startDate`** (`startDate - 7 days`), at which point dependent modules (classes, course scheduling, teacher assignments, registrations) become creatable.
  - Critical activation period spans `[startDate - 7 days, startDate + 7 days]`.
  - Always import and use centralized constants and helpers from `@workspace/types` (`TERM_PRE_ACTIVATION_DAYS`, `getTermActivationDate`, `getTermPostActivationDate`, `isTermActivated`, `isTermInActivationWindow`).

---

## Context Routing & Skills Hub

For deeper app-specific constraints and procedural blueprints, refer to:

- **Admin Page Blueprint (New Full Pages Only):** `.agents/skills/kalameh-admin-page/SKILL.md`
- **Code Scaffolding & Turbo Generator:** `.agents/skills/kalameh-turbo-generator/SKILL.md`
- **Skills Frontmatter Standard:** All `SKILL.md` files under `.agents/skills/` must strictly enclose their YAML frontmatter with opening and closing `---` delimiters and format descriptions using `description: >-` block scalar folding.
- **Database & Migrations Rules:** `packages/database/AGENTS.md`
- **Backend API Rules:** `apps/api/AGENTS.md`
- **Admin Dashboard Rules:** `apps/admin-panel/AGENTS.md`
- **Student PWA Rules:** `apps/student-pwa/AGENTS.md`
- **Shared UI Library Rules:** `packages/ui/AGENTS.md`
- **Shared Types Rules:** `packages/types/AGENTS.md`
