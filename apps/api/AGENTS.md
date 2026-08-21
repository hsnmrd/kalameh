# Backend Rules (`apps/api`)

- **Framework:** NestJS application providing RESTful APIs.
- **Architecture:** Keep controllers thin; place all business and domain logic in injectable services.
- **Validation (Zod Only):** DO NOT use `class-validator`. All input validation DTOs must use Zod schemas defined in `@workspace/types` paired with `nestjs-zod` / `ZodValidationPipe`.
- **Database Access:** Access Prisma through the global `PrismaService` (which delegates to `@workspace/database`).
- **SaaS Tenant Isolation:** Every query on tenant entities (`User`, `Course`, `Term`, `Class`, `Transaction`) must explicitly filter by `where: { instituteId }`.
- **Authentication & HttpOnly Cookies:**
  - Login endpoint (`/auth/login`) must set an `httpOnly`, `sameSite: 'lax'`, `path: '/'` cookie (`access_token`) on the response.
  - Logout endpoint (`/auth/logout`) must clear the `access_token` cookie.
  - `JwtStrategy` must extract tokens from both `Authorization: Bearer <token>` header AND `access_token` cookie.
- **Role & Granular Permission Control (RBAC):**
  - Use shared `ROLES`, `PERMISSIONS`, and `ROLE_PERMISSIONS` from `@workspace/types`.
  - Enforce permissions using `@RequirePermissions(...)` with `PermissionsGuard` and role restrictions using `@Roles(...)` with `RolesGuard`.
  - `SUPER_ADMIN` has platform-wide bypass access for all permission checks.
- **CORS & Credentials:**
  - Enable `credentials: true` in CORS to support cross-origin HttpOnly cookie sharing with frontend apps (`admin-panel` and `student-pwa`).
- **Class Capacity Locking (Redis):** Temporary 30-minute reservation locks for class registration must be handled via Redis TTL keys (`kalameh:lock:class:{classId}:{studentId}`), never by persisting draft locks in PostgreSQL.
- **File Uploads:** Store uploaded asset URLs (e.g. payment receipt images) in the database. Do not store binary files directly on the local server disk.
- **Testing:** Write unit tests for services/pipes and e2e tests (`test/jest-e2e.json`) for authentication and transaction flows.
