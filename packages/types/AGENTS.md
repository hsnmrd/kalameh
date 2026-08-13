# Shared Types & Schemas (`packages/types`)

- **Role:** Single Source of Truth for Zod validation schemas and TypeScript types shared across `apps/api`, `apps/admin-panel`, and `apps/student-pwa`.
- **Zod Schemas First:** Define entities and request payloads using Zod (e.g. `UserSchema`, `CreateCourseSchema`, `EnrollmentSchema`).
- **Inferred Types:** Export inferred TypeScript types alongside schemas using `z.infer<typeof ...>`.
- **Zero Framework Coupling:** Do not import NestJS or Next.js code here; keep this package pure TypeScript + Zod.
