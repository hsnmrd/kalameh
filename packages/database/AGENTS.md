# Database & Prisma Rules (`packages/database`)

- **Schema Source:** Define all PostgreSQL data models in `schema.prisma`.
- **Client Generation:** Run `pnpm run db:generate` (`prisma generate`) to update `@prisma/client` types. Safe in both dev and production.
- **Dev Migrations:** Always create version-controlled migrations for schema changes:
  `pnpm run db:migrate:dev --name <descriptive_name>`
- **Production Migrations:** Production and CI/CD environments must ONLY run:
  `pnpm run db:migrate:deploy`
  _(Never use `db push` or `migrate dev` in production)_.
- **Index Discipline:** Always add indexes on foreign keys and tenant lookups (`@@index([instituteId])`).
- **Client Export:** Export the singleton client and all generated types from `src/index.ts`.
