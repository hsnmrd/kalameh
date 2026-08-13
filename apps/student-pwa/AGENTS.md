# Student PWA Rules (`apps/student-pwa`)

- **Role:** Mobile-first Progressive Web Application (PWA) for students.
- **Layout Constraint (Critical):** On desktop viewports, lock layout to a maximum width of `480px` (`max-w-[480px] mx-auto min-h-screen`) and center it on screen with touch-optimized margins.
- **UI Primitives:** Use `@workspace/ui` (shadcn/ui + Tailwind CSS) as the component source.
- **Data & State Management:** Use `micro-rq` / TanStack React Query for cached REST queries and optimistic mutations.
- **Validation:** Use `react-hook-form` and shared Zod schemas from `@workspace/types`.
- **Core Student Flows (V1 Scope):**
  - View allowed courses based on placement level / prerequisite chain.
  - Class enrollment & 30-minute capacity reservation lock.
  - View institute bank card info & upload payment receipt (tracking code + receipt image URL).
  - Track enrollment status (Pending Payment, Pending Approval, Enrolled, Rejected, Waitlisted).
- **Mobile UX:** Ensure touch-friendly tap targets (minimum 44x44px), smooth gesture feedback, and responsive bottom navigation.
