# Repository Engineering Rules (Global Hub)

- Follow SOLID principles across all apps and packages.
- Write test files for new behavior (unit tests for focused logic, integration/e2e for critical flows).

## Context Routing

To reduce token burn and preserve context precision, read the relevant scoped rules before modifying code in any app or package:

- **Database & Migrations (`packages/database`):** Read `packages/database/AGENTS.md`
- **Backend API (`apps/api`):** Read `apps/api/AGENTS.md`
- **Admin Dashboard (`apps/admin-panel`):** Read `apps/admin-panel/AGENTS.md`
- **Student PWA (`apps/student-pwa`):** Read `apps/student-pwa/AGENTS.md`
- **Shared UI Library (`packages/ui`):** Read `packages/ui/AGENTS.md`
- **Shared Zod Types (`packages/types`):** Read `packages/types/AGENTS.md`
