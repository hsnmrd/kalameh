# Shared Types & Schemas (`packages/types`)

- **Role:** Single Source of Truth for Zod validation schemas and TypeScript types shared across `apps/api`, `apps/admin-panel`, and `apps/student-pwa`.
- **Roles & Permissions Definition (`as const`):**
- **Domain Feature Folders Structure:**
  - Every domain must have its own directory under `src/` (e.g. `src/auth/`, `src/roles/`, `src/user/`, `src/institute/`, `src/i18n/`).
  - Inside each domain folder, every schema, constant, or helper has its own dedicated file (e.g. `src/auth/login.schema.ts`, `src/auth/jwt-payload.schema.ts`).
  - Every domain folder contains an `index.ts` barrel that exports all its files.
  - The root `src/index.ts` re-exports all domain barrels alongside `zod`.
  - Schemas must remain pure and unopinionated without hardcoded localized default strings.
- **Zero Framework Coupling:** Do not import NestJS or Next.js code here; keep this package pure TypeScript + Zod.
- **Term Activation Window Standard:** Maintain `TERM_PRE_ACTIVATION_DAYS = 7` and `TERM_POST_ACTIVATION_DAYS = 7` alongside `getTermActivationDate`, `getTermPostActivationDate`, `getTermActivationWindow`, `isTermActivated`, `isTermInActivationWindow`, and `isTermPostActivationPassed` (with opening aliases) in `src/term/term-activation-window.ts` as the single source of truth for term activation and commencement anchor dates.
