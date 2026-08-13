# Student PWA Rules (`apps/student-pwa`)

- **Role:** Mobile-first Progressive Web Application (PWA) for students and class representatives.
- **Layout Constraint (Critical):** On desktop viewports, lock layout to a maximum width of `480px` (`max-w-[480px] mx-auto min-h-screen`) and center it on screen with touch-optimized margins.
- **UI Primitives:** Use `@workspace/ui` (shadcn/ui + Tailwind CSS) as the component source.
- **Data & State Management:** Use `micro-rq` / TanStack React Query for cached REST queries and optimistic mutations.
- **Validation:** Use `react-hook-form` and shared Zod schemas from `@workspace/types`.
- **Core Student Flows:**
  - Class enrollment & waitlist request.
  - Payment receipt upload (tracking code & receipt image URL).
  - Gamified Leitner vocabulary review (flashcards, quiz, spelling, daily streaks, report mistake).
- **Mobile UX:** Ensure touch-friendly tap targets (minimum 44x44px), smooth gesture feedback, and responsive bottom navigation.
