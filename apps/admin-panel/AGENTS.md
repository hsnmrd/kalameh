# Admin Panel Frontend Rules (`apps/admin-panel`)

- **Role:** Desktop web dashboard for Institute Admins, Clerks, and Super Admins.
- **Route Architecture & RBAC:** Organize the App Router into role-scoped Route Groups:
  ```text
  app/
  ├── (auth)/                     # Shared Login / Password Reset
  │   └── login/
  ├── (super-admin)/              # 🛡️ Protected for Role: SUPER_ADMIN
  │   ├── layout.tsx              # Platform-level sidebar & navigation
  │   └── institutes/             # Institute CRUD & license management
  └── (institute)/                # 🏫 Protected for Role: INSTITUTE_ADMIN & CLERK
      ├── layout.tsx              # Institute-level sidebar
      ├── courses/
      ├── classes/
      ├── terms/
      └── transactions/
  ```
- **Visual Design:** Read `DESIGN.md` before changing UI. Compose pages using `@workspace/ui` (shadcn/ui + Tailwind CSS) rather than ad-hoc HTML.
- **Design Tokens:** Use CSS variables from `packages/ui/src/styles/globals.css`. Ensure dark/light themes work via CSS variables.
- **Data Fetching & REST:** Use `micro-rq` (TanStack React Query wrapper) to define API resources and queries/mutations. Do not write manual `fetch`/`axios` wrappers inside components.
- **Forms & Validation:** Always use `react-hook-form` paired with `@hookform/resolvers/zod` and shared Zod schemas from `@workspace/types`.
- **Motion & Interactions:** Use `motion/react` for smooth transitions and data view animations.
- **File Length:** Keep files under 250 lines. Decompose large tables, dialogs, and forms into dedicated subcomponents.
