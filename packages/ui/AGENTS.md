# Shared UI Library Rules (`packages/ui`)

- **Role:** Centralized, reusable component library based on Tailwind CSS v4, Base UI, and shadcn/ui patterns.
- **Component Installation & Kits:** When a new UI primitive or kit is needed (e.g. dialog, table, select, dropdown), install/scaffold it from shadcn headless UI (`@base-ui/react` primitives) directly inside `packages/ui`. If it does not exist, discuss before adding custom raw HTML.
- **Loading UI Standard:**
  - Always export and use the shadcn `<Spinner />` component (`src/components/spinner.tsx`) for all loading states across the monorepo instead of `lucide-react` icons (e.g. `Loader2`).
- **Toast Notifications Standard:**
  - Provide `<Toaster />` and `toast` via `src/components/sonner.tsx` configured to inherit the application's font typography (`var(--font-sans)`).
- **Purely Presentational:** Keep UI components stateless or internally controlled; do NOT import business logic or app-specific state here.
- **Design Tokens:** All colors, radius, shadows, and fonts are defined as CSS variables in `src/styles/globals.css`.
- **Export Discipline:** Expose components through the `package.json` `exports` map (`./components/*`, `./lib/*`, `./hooks/*`, `./globals.css`).
- **Accessibility:** Ensure every interactive component satisfies WCAG 2.1 AA standards (proper ARIA attributes, keyboard navigation, focus rings).
