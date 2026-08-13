# Backend Rules (`apps/api`)

- **Framework:** NestJS application providing RESTful APIs.
- **Architecture:** Keep controllers thin; place all business and domain logic in injectable services.
- **Validation (Zod Only):** DO NOT use `class-validator`. All input validation DTOs must use Zod schemas defined in `@workspace/types` paired with `nestjs-zod` / `ZodValidationPipe`.
- **Database Access:** Access Prisma through the global `PrismaService` (which delegates to `@workspace/database`).
- **SaaS Tenant Isolation:** Every query on tenant entities (`User`, `Course`, `Term`, `Class`, `Transaction`) must explicitly filter by `where: { instituteId }`.
- **Class Capacity Locking (Redis):** Temporary 30-minute reservation locks for class registration must be handled via Redis TTL keys (`kalameh:lock:class:{classId}:{studentId}`), never by persisting draft locks in PostgreSQL.
- **File Uploads:** Store uploaded asset URLs (e.g. payment receipt images) in the database. Do not store binary files directly on the local server disk.
- **Testing:** Write unit tests for services/pipes and e2e tests (`test/jest-e2e.json`) for authentication and transaction flows.
