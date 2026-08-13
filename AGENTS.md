<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository engineering rules

- Follow SOLID principles across all apps and packages.
- Write test files for new behavior. Match test scope to risk: unit tests for focused logic, integration/e2e tests for wiring and user-facing flows.

## Database & Migration Rules (Production-Grade)

- **Client Generation:** Use `pnpm run db:generate` (`prisma generate`) to create TypeScript client types. This command is non-destructive, does not touch the database, and is safe in both dev and production.
- **Development Migrations:** Always create version-controlled migration files for schema changes using `pnpm run db:migrate:dev --name <descriptive_name>`.
- **Production Migrations:** Production environments and CI/CD must ONLY apply migrations using `pnpm run db:migrate:deploy` (`prisma migrate deploy`). Never use `prisma migrate dev` or `prisma db push` in production.
- **Tenant Isolation (SaaS):** Every tenant-scoped query must enforce `instituteId` in the `where` filter to prevent data leakage across institutes.
- **Shared Package Import:** Always import database models and the Prisma client from `@workspace/database` (`import { prisma, Role, User } from "@workspace/database"`).
