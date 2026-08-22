# Database & Prisma Rules (`packages/database`)

- **Schema Source:** Define all PostgreSQL data models in `schema.prisma`.
- **Client Generation:** Run `pnpm run db:generate` (`prisma generate`) to update Prisma Client types in `src/generated/client`. Safe in both dev and production.
- **Dev Migrations:** Always create version-controlled migrations for schema changes:
  `pnpm run db:migrate:dev --name <descriptive_name>`
  - When modifying `schema.prisma`, AI agents must immediately execute this command with a meaningful name and run `pnpm run db:generate`. Never leave schema edits unmigrated.
- **Production Migrations:** Production and CI/CD environments must ONLY run:
  `pnpm run db:migrate:deploy`
  _(Never use `db push` or `migrate dev` in production)_.
- **Database Seeding:**
  - Execute `pnpm run db:seed` to populate sample testing data from `src/seed.ts`.
  - Default seeded accounts (Password for all: `Password123!`):
    - **Super Admin:** `09120000001` (Role: `SUPER_ADMIN`)
    - **Institute Admin:** `09120000002` (Role: `INSTITUTE_ADMIN`, Subdomain: `tehran`)
    - **Clerk:** `09120000003` (Role: `CLERK`, Subdomain: `tehran`)
    - **Student:** `09120000004` (Role: `STUDENT`, Subdomain: `tehran`)
- **Index Discipline:** Always add indexes on foreign keys and tenant lookups (`@@index([instituteId])`).
- **Client Export:** Export the singleton client and all generated types from `src/index.ts`.
